import { Track, ShuffleMode, RepeatMode } from '../types';
import { saveTrackMemory, getTrackMemory } from './storage';

// Smart Fisher-Yates with artist separation
export function generateSmartShuffleQueue(tracks: Track[], currentTrackId?: string): string[] {
  if (tracks.length === 0) return [];
  if (tracks.length === 1) return [tracks[0].id];

  // Separate current track from pool
  const pool = tracks.filter((t) => t.id !== currentTrackId);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Smart adjustment: avoid back-to-back same artist if possible
  for (let i = 0; i < pool.length - 1; i++) {
    if (pool[i].artist && pool[i].artist === pool[i + 1].artist) {
      // Find a track further down with a different artist and swap
      const swapIndex = pool.findIndex((t, idx) => idx > i + 1 && t.artist !== pool[i].artist);
      if (swapIndex !== -1) {
        [pool[i + 1], pool[swapIndex]] = [pool[swapIndex], pool[i + 1]];
      }
    }
  }

  const result = pool.map((t) => t.id);
  if (currentTrackId) {
    result.unshift(currentTrackId);
  }
  return result;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatDetailedTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

class AudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private isInitialized = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    // iOS Safari webkit inline audio attributes
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');
  }

  public initAudioContext(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

      // Create Analyser
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // Create Gain
      this.gainNode = this.audioContext.createGain();

      // Create 2-band EQ for touch Pi tone control
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 180;
      this.bassFilter.gain.value = 0;

      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 3500;
      this.trebleFilter.gain.value = 0;

      // Pipeline: source -> bass -> treble -> analyser -> gain -> destination
      this.sourceNode.connect(this.bassFilter);
      this.bassFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.analyserNode);
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API routing note:', err);
    }
  }

  public resumeContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public getMasterGainNode(): GainNode | null {
    return this.gainNode;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.audio.volume = clamped;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(clamped, this.audioContext?.currentTime || 0);
    }
  }

  public setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  public setTone(bassGain: number, trebleGain: number): void {
    if (this.bassFilter && this.trebleFilter && this.audioContext) {
      const now = this.audioContext.currentTime;
      this.bassFilter.gain.setValueAtTime(bassGain, now);
      this.trebleFilter.gain.setValueAtTime(trebleGain, now);
    }
  }
}

export const GlobalAudioEngine = new AudioEngine();

// Dedicated audio engine for athlete goal celebrations.
// Keeps soundboard playback decoupled from the main Arena Transport Bar.
class GoalAudioEngine {
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');
  }

  public async play(url: string, startTime = 0, volume = 1): Promise<void> {
    this.audio.pause();
    this.audio.src = url;
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.audio.currentTime = startTime;
    return this.audio.play();
  }

  public stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  public setVolume(vol: number): void {
    this.audio.volume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audio;
  }
}

export const GlobalGoalAudioEngine = new GoalAudioEngine();
