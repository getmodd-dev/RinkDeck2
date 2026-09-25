import { Track } from '../types';

/**
 * Creates an AudioBuffer and encodes it into a standard 16-bit PCM WAV Blob.
 * This runs completely client-side in seconds and produces a full audio file.
 */
function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  const channelData = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamping between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

// Procedural music generator using OfflineAudioContext
export type AudioSynthStyle =
  | 'lofi'
  | 'synthwave'
  | 'ambient'
  | 'piano'
  | 'electro'
  | 'silent_ice'
  | 'classic_horn'
  | 'fog_blast'
  | 'charge_organ'
  | 'victory_fifth'
  | 'siren_sweep'
  | 'hat_trick';

export async function generateDemoTrackBlob(style: AudioSynthStyle, durationSeconds = 75): Promise<Blob> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.connect(ctx.destination);

  // Reverb simulation
  const convolver = ctx.createConvolver();
  const revDuration = 2.5;
  const revBuffer = ctx.createBuffer(2, sampleRate * revDuration, sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = revBuffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    }
  }
  convolver.buffer = revBuffer;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.25;
  wetGain.connect(masterGain);
  convolver.connect(wetGain);

  if (style === 'classic_horn') {
    // Authentic multi-tone NHL stadium horn blast
    const hornFrequencies = [164.81, 207.65, 261.63, 329.63]; // E3, G#3, C4, E4
    hornFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, 0);
      osc.frequency.linearRampToValueAtTime(freq * 1.01, 0.3);
      osc.frequency.linearRampToValueAtTime(freq, durationSeconds - 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, 0);

      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.3 / (idx + 1), 0.08);
      gain.gain.setValueAtTime(0.28 / (idx + 1), durationSeconds - 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, durationSeconds);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(convolver);
      gain.connect(masterGain);

      osc.start(0);
      osc.stop(durationSeconds);
    });
  } else if (style === 'fog_blast') {
    // Deep resonant naval / arena foghorn
    [98.0, 123.47, 146.83].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, 0);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, 0);

      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.35, 0.15);
      gain.gain.setValueAtTime(0.32, durationSeconds - 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, durationSeconds);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(convolver);
      gain.connect(masterGain);

      osc.start(0);
      osc.stop(durationSeconds);
    });
  } else if (style === 'charge_organ') {
    // Classic arena stadium Hammond organ "Charge!" fanfare
    // Notes: G3 (0.2s), C4 (0.2s), E4 (0.2s), G4 (0.3s), E4 (0.15s), G4 (hold 2s)
    const organNotes = [
      { f: 196.0, start: 0.1, dur: 0.22 },
      { f: 261.63, start: 0.35, dur: 0.22 },
      { f: 329.63, start: 0.6, dur: 0.22 },
      { f: 392.0, start: 0.85, dur: 0.35 },
      { f: 329.63, start: 1.25, dur: 0.2 },
      { f: 392.0, start: 1.5, dur: 3.5 },
    ];
    organNotes.forEach((n) => {
      [1, 2, 3].forEach((harmonic) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = harmonic === 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(n.f * harmonic, n.start);

        const vol = (0.28 / harmonic) * (n.dur > 1 ? 1.2 : 0.9);
        gain.gain.setValueAtTime(0, n.start);
        gain.gain.linearRampToValueAtTime(vol, n.start + 0.02);
        gain.gain.setValueAtTime(vol * 0.85, n.start + n.dur - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, n.start + n.dur);

        osc.connect(gain);
        gain.connect(convolver);
        gain.connect(masterGain);
        osc.start(n.start);
        osc.stop(n.start + n.dur);
      });
    });
  } else if (style === 'victory_fifth') {
    // Uplifting fanfare fifth chords
    const victoryChords = [
      { notes: [261.63, 329.63, 392.0], start: 0.1, dur: 0.8 },
      { notes: [293.66, 369.99, 440.0], start: 1.0, dur: 0.8 },
      { notes: [329.63, 415.30, 493.88], start: 1.9, dur: 0.8 },
      { notes: [392.0, 493.88, 587.33, 783.99], start: 2.8, dur: durationSeconds - 2.8 },
    ];
    victoryChords.forEach((c) => {
      c.notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, c.start);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, c.start);

        gain.gain.setValueAtTime(0, c.start);
        gain.gain.linearRampToValueAtTime(0.18, c.start + 0.05);
        gain.gain.setValueAtTime(0.15, c.start + c.dur - 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, c.start + c.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(convolver);
        gain.connect(masterGain);

        osc.start(c.start);
        osc.stop(c.start + c.dur);
      });
    });
  } else if (style === 'siren_sweep') {
    // Rising and sweeping stadium siren
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, 0);
    osc.frequency.linearRampToValueAtTime(950, 1.2);
    osc.frequency.linearRampToValueAtTime(500, 2.4);
    osc.frequency.linearRampToValueAtTime(1000, 3.6);
    osc.frequency.linearRampToValueAtTime(450, durationSeconds);

    gain.gain.setValueAtTime(0, 0);
    gain.gain.linearRampToValueAtTime(0.35, 0.1);
    gain.gain.setValueAtTime(0.35, durationSeconds - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, durationSeconds);

    osc.connect(gain);
    gain.connect(convolver);
    gain.connect(masterGain);
    osc.start(0);
    osc.stop(durationSeconds);
  } else if (style === 'hat_trick') {
    // Energetic arena celebration rhythm
    const bpm = 130;
    const beat = 60 / bpm;
    let t = 0.1;
    while (t < durationSeconds - 0.5) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63 * 2, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beat * 0.4);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + beat * 0.45);
      t += beat * 0.5;
    }
  } else if (style === 'silent_ice') {
    // Ambient icy pre-game atmosphere
    const frequencies = [65.41, 130.81, 196.0, 293.66, 392.0];
    frequencies.forEach((freq, idx) => {
      let t = 0.2;
      while (t < durationSeconds - 2) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        const swell = 6 + idx * 1.5;
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.12 / (idx + 1), t + swell * 0.4);
        g.gain.linearRampToValueAtTime(0.001, t + swell);
        osc.connect(g);
        g.connect(convolver);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + swell);
        t += swell * 0.7;
      }
    });
  } else if (style === 'lofi') {
    // Lo-Fi Beat with rhodes chords and soft kick/snare
    const bpm = 84;
    const beatSec = 60 / bpm;
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    let t = 0.2;
    let chordIdx = 0;
    while (t < durationSeconds - 2) {
      const chord = chords[chordIdx % chords.length];
      chord.forEach((freq, fi) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.08 / (fi + 1), t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + beatSec * 3.8);
        osc.connect(g);
        g.connect(masterGain);
        g.connect(convolver);
        osc.start(t);
        osc.stop(t + beatSec * 3.9);
      });

      // Sub Bass
      const bassOsc = ctx.createOscillator();
      const bassG = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, t);
      bassG.gain.setValueAtTime(0.001, t);
      bassG.gain.linearRampToValueAtTime(0.18, t + 0.04);
      bassG.gain.exponentialRampToValueAtTime(0.0001, t + beatSec * 3.5);
      bassOsc.connect(bassG);
      bassG.connect(masterGain);
      bassOsc.start(t);
      bassOsc.stop(t + beatSec * 3.6);

      // Drum beats inside chord measure
      for (let b = 0; b < 4; b++) {
        const beatTime = t + b * beatSec;
        if (beatTime >= durationSeconds - 1) break;

        // Kick on 1 and 3
        if (b === 0 || b === 2) {
          const kickOsc = ctx.createOscillator();
          const kickG = ctx.createGain();
          kickOsc.frequency.setValueAtTime(130, beatTime);
          kickOsc.frequency.exponentialRampToValueAtTime(42, beatTime + 0.12);
          kickG.gain.setValueAtTime(0.4, beatTime);
          kickG.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.22);
          kickOsc.connect(kickG);
          kickG.connect(masterGain);
          kickOsc.start(beatTime);
          kickOsc.stop(beatTime + 0.25);
        }

        // Snare/rimshot on 2 and 4
        if (b === 1 || b === 3) {
          const snareNoise = ctx.createBufferSource();
          const nBuffer = ctx.createBuffer(1, sampleRate * 0.15, sampleRate);
          const nData = nBuffer.getChannelData(0);
          for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.03));
          snareNoise.buffer = nBuffer;
          const snareFilter = ctx.createBiquadFilter();
          snareFilter.type = 'bandpass';
          snareFilter.frequency.value = 1800;
          const snareG = ctx.createGain();
          snareG.gain.setValueAtTime(0.2, beatTime);
          snareG.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.14);
          snareNoise.connect(snareFilter);
          snareFilter.connect(snareG);
          snareG.connect(masterGain);
          snareNoise.start(beatTime);
        }

        // Soft Hi-hat on every eighth note
        [0, 0.5].forEach((offset) => {
          const hatTime = beatTime + offset * beatSec;
          const hatNode = ctx.createBufferSource();
          const hatBuf = ctx.createBuffer(1, sampleRate * 0.05, sampleRate);
          const hData = hatBuf.getChannelData(0);
          for (let i = 0; i < hData.length; i++) hData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.008));
          hatNode.buffer = hatBuf;
          const hatFilter = ctx.createBiquadFilter();
          hatFilter.type = 'highpass';
          hatFilter.frequency.value = 7500;
          const hatG = ctx.createGain();
          hatG.gain.setValueAtTime(0.08, hatTime);
          hatG.gain.exponentialRampToValueAtTime(0.0001, hatTime + 0.04);
          hatNode.connect(hatFilter);
          hatFilter.connect(hatG);
          hatG.connect(masterGain);
          hatNode.start(hatTime);
        });
      }

      t += beatSec * 4;
      chordIdx++;
    }
  } else if (style === 'synthwave') {
    // 80s Synthwave Drive
    const bpm = 116;
    const step = 60 / bpm / 4;
    const bassNotes = [110, 110, 110, 110, 87.31, 87.31, 98, 98]; // A2, F2, G2

    let t = 0.1;
    let stepIdx = 0;
    while (t < durationSeconds - 2) {
      const note = bassNotes[Math.floor(stepIdx / 16) % bassNotes.length];
      // 16th note synth bass
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(350, t + step * 0.9);

      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + step * 0.85);

      osc.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + step);

      // Four on the floor Kick
      if (stepIdx % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickG = ctx.createGain();
        kickOsc.frequency.setValueAtTime(160, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        kickG.gain.setValueAtTime(0.45, t);
        kickG.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        kickOsc.connect(kickG);
        kickG.connect(masterGain);
        kickOsc.start(t);
        kickOsc.stop(t + 0.2);
      }

      // Snare on 2 and 4 (steps 4 and 12)
      if (stepIdx % 16 === 4 || stepIdx % 16 === 12) {
        const snareOsc = ctx.createOscillator();
        const snareG = ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(220, t);
        snareG.gain.setValueAtTime(0.25, t);
        snareG.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        snareOsc.connect(snareG);
        snareG.connect(masterGain);
        snareOsc.start(t);
        snareOsc.stop(t + 0.16);
      }

      t += step;
      stepIdx++;
    }
  } else if (style === 'piano') {
    // Neo-classical gentle piano & strings
    const scale = [220.0, 246.94, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    let t = 0.5;
    while (t < durationSeconds - 2) {
      const f1 = scale[Math.floor(Math.random() * scale.length)];
      const f2 = scale[Math.floor(Math.random() * scale.length)];

      [f1, f2].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.12, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
        osc.connect(g);
        g.connect(masterGain);
        g.connect(convolver);
        osc.start(t);
        osc.stop(t + 3.0);
      });

      // Warm cello drone in bass
      const cello = ctx.createOscillator();
      const cGain = ctx.createGain();
      cello.type = 'triangle';
      cello.frequency.setValueAtTime(f1 / 2, t);
      cGain.gain.setValueAtTime(0.001, t);
      cGain.gain.linearRampToValueAtTime(0.09, t + 0.4);
      cGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      cello.connect(cGain);
      cGain.connect(masterGain);
      cGain.connect(convolver);
      cello.start(t);
      cello.stop(t + 3.5);

      t += 1.8;
    }
  } else if (style === 'ambient') {
    // Evolving ambient drone with warm harmonic swells
    const freqs = [130.81, 196.0, 261.63, 392.0, 523.25]; // C chord harmonics
    freqs.forEach((freq, idx) => {
      let t = 0.1;
      while (t < durationSeconds - 3) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (1 + (Math.random() * 0.01 - 0.005)), t);
        const swellDuration = 4 + idx * 1.5;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.08 / (idx + 1), t + swellDuration * 0.4);
        g.gain.linearRampToValueAtTime(0.0001, t + swellDuration);
        osc.connect(g);
        g.connect(convolver);
        g.connect(masterGain);
        osc.start(t);
        osc.stop(t + swellDuration);
        t += swellDuration * 0.75;
      }
    });
  } else {
    // Electro Bass Drive
    const bpm = 124;
    const beatSec = 60 / bpm;
    let t = 0.2;
    while (t < durationSeconds - 1) {
      // Sub punch
      const kickOsc = ctx.createOscillator();
      const kickG = ctx.createGain();
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      kickG.gain.setValueAtTime(0.4, t);
      kickG.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      kickOsc.connect(kickG);
      kickG.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.22);

      // Acid Saw pluck
      const sawOsc = ctx.createOscillator();
      const sawF = ctx.createBiquadFilter();
      const sawG = ctx.createGain();
      sawOsc.type = 'sawtooth';
      sawOsc.frequency.setValueAtTime(98, t + beatSec * 0.5);
      sawF.type = 'lowpass';
      sawF.frequency.setValueAtTime(2500, t + beatSec * 0.5);
      sawF.frequency.exponentialRampToValueAtTime(200, t + beatSec * 0.9);
      sawG.gain.setValueAtTime(0.2, t + beatSec * 0.5);
      sawG.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.9);
      sawOsc.connect(sawF);
      sawF.connect(sawG);
      sawG.connect(masterGain);
      sawOsc.start(t + beatSec * 0.5);
      sawOsc.stop(t + beatSec);

      t += beatSec;
    }
  }

  const renderedBuffer = await ctx.startRendering();
  return encodeWAV(renderedBuffer);
}

/**
 * Built-in default tracks list. We generate their WAV blobs asynchronously on demand,
 * or pre-generate when the user selects or boots them.
 */
export const INITIAL_DEMO_TRACKS: Omit<Track, 'url' | 'blob'>[] = [
  {
    id: 'demo_silent_ice',
    title: 'Silent ice',
    artist: 'Arena Atmosphere',
    album: 'Pre-Game Warmup',
    duration: 180,
    presetStart: 0,
    presetEnd: 180,
    coverColor: '#0ea5e9',
    format: 'WAV 24-bit / 48kHz',
    genre: 'Arena Chill',
    fileSize: '15.4 MB',
    isLocalFile: false,
    addedAt: 1700000000000,
  },
  {
    id: 'demo_classic_horn',
    title: 'Classic Horn',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 8,
    presetStart: 0,
    presetEnd: 8,
    coverColor: '#f43f5e',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Goal Horn',
    fileSize: '1.2 MB',
    isLocalFile: false,
    addedAt: 1700000001000,
  },
  {
    id: 'demo_fog_blast',
    title: 'Fog Blast',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 7,
    presetStart: 0,
    presetEnd: 7,
    coverColor: '#e11d48',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Goal Horn',
    fileSize: '1.1 MB',
    isLocalFile: false,
    addedAt: 1700000002000,
  },
  {
    id: 'demo_charge_organ',
    title: 'Charge Organ',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 6,
    presetStart: 0,
    presetEnd: 6,
    coverColor: '#f59e0b',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Organ Fanfare',
    fileSize: '0.9 MB',
    isLocalFile: false,
    addedAt: 1700000003000,
  },
  {
    id: 'demo_victory_fifth',
    title: 'Victory Fifth',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 5,
    presetStart: 0,
    presetEnd: 5,
    coverColor: '#10b981',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Fanfare',
    fileSize: '0.8 MB',
    isLocalFile: false,
    addedAt: 1700000004000,
  },
  {
    id: 'demo_siren_sweep',
    title: 'Siren Sweep',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 6,
    presetStart: 0,
    presetEnd: 6,
    coverColor: '#a855f7',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Siren',
    fileSize: '0.9 MB',
    isLocalFile: false,
    addedAt: 1700000005000,
  },
  {
    id: 'demo_hat_trick',
    title: 'Hat Trick',
    artist: 'horn',
    album: 'Arena Soundboard',
    duration: 5,
    presetStart: 0,
    presetEnd: 5,
    coverColor: '#ec4899',
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Sting',
    fileSize: '0.8 MB',
    isLocalFile: false,
    addedAt: 1700000006000,
  },
  {
    id: 'demo_track_lofi',
    title: 'Raspberry Serenade',
    artist: 'Pi Touch Ensemble',
    album: 'Lo-Fi Tape Sessions Vol. 1',
    duration: 75,
    presetStart: 0, // Starts from beginning by default
    presetEnd: 75,
    coverColor: '#0ea5e9', // Sky Cyan
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Lo-Fi Chillhop',
    fileSize: '13.2 MB',
    isLocalFile: false,
    addedAt: 1700000007000,
  },
  {
    id: 'demo_track_synthwave',
    title: 'Neon Horizon 1984',
    artist: 'RetroPi Wave',
    album: 'Cyber Circuitry',
    duration: 80,
    presetStart: 0, // Starts from beginning by default
    presetEnd: 80,
    coverColor: '#f43f5e', // Rose Coral
    format: 'FLAC 24-bit / 48kHz',
    genre: 'Synthwave',
    fileSize: '16.8 MB',
    isLocalFile: false,
    addedAt: 1700000008000,
  },
  {
    id: 'demo_track_ambient',
    title: 'Midnight Forest Drone',
    artist: 'Ether & Granite',
    album: 'Acoustic Sanctuary',
    duration: 90,
    presetStart: 0, // Starts from beginning by default
    presetEnd: 90,
    coverColor: '#10b981', // Emerald
    format: 'WAV 24-bit / 96kHz',
    genre: 'Ambient / Soundscape',
    fileSize: '18.4 MB',
    isLocalFile: false,
    addedAt: 1700000009000,
  },
  {
    id: 'demo_track_piano',
    title: 'Nordic Snow & Resonances',
    artist: 'Klara Lindqvist',
    album: 'Solitary Echoes',
    duration: 70,
    presetStart: 0, // Starts from beginning by default
    presetEnd: 70,
    coverColor: '#a855f7', // Purple
    format: 'FLAC 24-bit / 96kHz',
    genre: 'Neo-Classical',
    fileSize: '14.1 MB',
    isLocalFile: false,
    addedAt: 1700000004000,
  },
  {
    id: 'demo_track_electro',
    title: 'Subterranean Core',
    artist: 'Kernel Panic Collective',
    album: 'GPIO Overvoltage',
    duration: 65,
    presetStart: 0, // Starts from beginning by default
    presetEnd: 65,
    coverColor: '#f59e0b', // Amber
    format: 'WAV 16-bit / 44.1kHz',
    genre: 'Industrial Electro',
    fileSize: '12.6 MB',
    isLocalFile: false,
    addedAt: 1700000005000,
  },
];
