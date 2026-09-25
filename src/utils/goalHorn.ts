// Stadium Goal Horn controller: supports both custom audio files in /app/data/sounds/
// and an authentic multi-oscillator Web Audio API synthesis engine.
import { GlobalAudioEngine } from './audioController';
import {
  saveCustomGoalHornBlob,
  loadCustomGoalHornBlob,
  deleteCustomGoalHornBlob,
} from './storage';

let customHornAudioElement: HTMLAudioElement | null = null;
let customHornUrl: string | null = null;
let customHornFileName: string | null = null;
let isInitialized = false;

// Initialize custom horn from /api/horn/info (server in /app/data) or IndexedDB fallback
export async function initGoalHornAudio(): Promise<string | null> {
  if (isInitialized && customHornFileName) return customHornFileName;
  try {
    // 1. Try server first (/app/data/sounds)
    const res = await fetch('/api/horn/info');
    if (res.ok) {
      const data = await res.json();
      if (data.custom && data.fileName) {
        customHornFileName = data.fileName;
        customHornUrl = data.url || '/api/horn/audio';
        customHornAudioElement = new Audio(customHornUrl);
        customHornAudioElement.preload = 'auto';
        isInitialized = true;
        return customHornFileName;
      }
    }
  } catch {
    // offline or local dev without server
  }

  // 2. Fallback to IndexedDB
  try {
    const saved = await loadCustomGoalHornBlob();
    if (saved && saved.blob) {
      customHornUrl = URL.createObjectURL(saved.blob);
      customHornFileName = saved.fileName;
      customHornAudioElement = new Audio(customHornUrl);
      customHornAudioElement.preload = 'auto';
    } else {
      customHornFileName = null;
      customHornUrl = null;
      customHornAudioElement = null;
    }
  } catch (err) {
    console.warn('Failed to load custom goal horn from IndexedDB:', err);
  }

  isInitialized = true;
  return customHornFileName;
}

// Set a custom horn file and persist to /app/data on server
export async function setCustomGoalHorn(file: File): Promise<string> {
  try {
    // Save to IndexedDB locally
    await saveCustomGoalHornBlob(file, file.name);

    // Upload to server /app/data/sounds/
    try {
      const formData = new FormData();
      formData.append('horn', file);
      const res = await fetch('/api/horn/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        customHornFileName = data.fileName || file.name;
        customHornUrl = '/api/horn/audio?' + Date.now();
        customHornAudioElement = new Audio(customHornUrl);
        customHornAudioElement.preload = 'auto';
        isInitialized = true;
        return file.name;
      }
    } catch (e) {
      console.warn('Server horn upload skipped, using client blob', e);
    }

    // Fallback to local Object URL
    if (customHornUrl && customHornUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customHornUrl);
    }
    customHornUrl = URL.createObjectURL(file);
    customHornFileName = file.name;
    customHornAudioElement = new Audio(customHornUrl);
    customHornAudioElement.preload = 'auto';
    isInitialized = true;
    return file.name;
  } catch (err) {
    console.error('Failed to set custom goal horn:', err);
    throw err;
  }
}

// Remove custom horn and revert back to built-in arena synth horn
export async function clearCustomGoalHorn(): Promise<void> {
  try {
    await deleteCustomGoalHornBlob();
    try {
      await fetch('/api/horn', { method: 'DELETE' });
    } catch {}

    if (customHornUrl && customHornUrl.startsWith('blob:')) {
      URL.revokeObjectURL(customHornUrl);
    }
    customHornUrl = null;
    customHornFileName = null;
    customHornAudioElement = null;
  } catch (err) {
    console.error('Failed to clear custom goal horn:', err);
  }
}

export function getCustomHornFileName(): string | null {
  return customHornFileName;
}

export function hasCustomGoalHorn(): boolean {
  return !!customHornFileName;
}

// Play the active horn (custom file if uploaded, otherwise Web Audio synthesizer)
export function playGoalHorn(): void {
  if (customHornUrl) {
    try {
      if (!customHornAudioElement) {
        customHornAudioElement = new Audio(customHornUrl);
      }
      customHornAudioElement.currentTime = 0;
      customHornAudioElement.play().catch((e) => {
        console.warn('Custom horn playback failed, falling back to synth horn', e);
        playStadiumGoalHorn();
      });
      return;
    } catch (e) {
      console.warn('Error initiating custom horn', e);
    }
  }

  // Fallback to built-in multi-oscillator stadium horn
  playStadiumGoalHorn();
}

let activeSynthGain: GainNode | null = null;

// Stop any currently blasting horn
export function stopGoalHorn(): void {
  if (customHornAudioElement) {
    customHornAudioElement.pause();
    customHornAudioElement.currentTime = 0;
  }
  if (activeSynthGain) {
    try {
      activeSynthGain.gain.setValueAtTime(0, 0);
    } catch {}
    activeSynthGain = null;
  }
}

// Authentic Multi-Oscillator Stadium Horn synthesizer (Kahlenberg / Buell arena air horn replica)
export function playStadiumGoalHorn(): void {
  try {
    GlobalAudioEngine.initAudioContext();
    GlobalAudioEngine.resumeContext();
    const ctx = GlobalAudioEngine.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 2.8;

    const masterGain = ctx.createGain();
    activeSynthGain = masterGain;

    // Distortion shaper for gritty air horn vibration
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(18);
    shaper.oversample = '4x';

    // Resonant bandpass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.Q.setValueAtTime(2.2, now);

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.85, now + 0.04);
    masterGain.gain.setValueAtTime(0.85, now + duration - 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Arena horn chords: D3 (146.8Hz), F3 (174.6Hz), A3 (220.0Hz), D4 (293.7Hz)
    const hornFrequencies = [
      { freq: 146.83, detune: -4, type: 'sawtooth' as OscillatorType, vol: 0.6 },
      { freq: 147.2, detune: 5, type: 'triangle' as OscillatorType, vol: 0.5 },
      { freq: 174.61, detune: 2, type: 'sawtooth' as OscillatorType, vol: 0.55 },
      { freq: 220.0, detune: -3, type: 'sawtooth' as OscillatorType, vol: 0.5 },
      { freq: 293.66, detune: 1, type: 'square' as OscillatorType, vol: 0.25 },
      { freq: 73.4, detune: 0, type: 'sine' as OscillatorType, vol: 0.7 }, // Sub rumble
    ];

    hornFrequencies.forEach((hf) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = hf.type;
      osc.frequency.setValueAtTime(hf.freq, now);
      osc.detune.setValueAtTime(hf.detune, now);

      // Pitch wobble from air pressure surge
      osc.frequency.linearRampToValueAtTime(hf.freq * 1.015, now + 0.1);
      osc.frequency.linearRampToValueAtTime(hf.freq, now + 0.35);

      oscGain.gain.setValueAtTime(hf.vol, now);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    });

    filter.connect(shaper);
    shaper.connect(masterGain);
    masterGain.connect(GlobalAudioEngine.getMasterGainNode() || ctx.destination);
  } catch (err) {
    console.error('Failed to synthesize stadium horn:', err);
  }
}

function makeDistortionCurve(amount = 20): Float32Array {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
