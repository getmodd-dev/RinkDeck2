export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  presetStart?: number; // Default preset start location in seconds
  presetEnd?: number; // Default preset endpoint in seconds
  coverUrl?: string;
  coverColor?: string;
  url?: string;
  blob?: Blob;
  isLocalFile: boolean;
  format?: string; // e.g., 'FLAC 24/96', 'MP3 320k', 'WAV 16/44'
  genre?: string;
  fileSize?: string;
  addedAt: number;
  source?: 'local' | 'demo';
  year?: number;
  trackNumber?: number;
  bitrate?: number;
  playlistCategory?: 'game' | 'player' | 'warmup' | 'general';
}

export interface TrackMemory {
  position: number; // in seconds
  duration: number;
  lastUpdated: number; // timestamp
  completed: boolean;
  startPoint?: number; // User preset start location (seconds)
  endPoint?: number; // User preset endpoint (seconds)
}

export type ShuffleMode = 'off' | 'smart' | 'random';
export type RepeatMode = 'off' | 'all' | 'one';
export type AudioOutput = 'dac' | 'hdmi' | 'analog' | 'bluetooth' | 'airplay' | 'ipad';

export interface PlayerSettings {
  volume: number;
  isMuted: boolean;
  rememberPosition: boolean;
  changeTrackOnPause: boolean; // Auto-advance track whenever paused
  resumeThreshold: number; // min seconds to store position (e.g. 3s)
  crossfade: number; // seconds
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  screenDimmer: number; // 0 to 80% dimming
  outputDevice: AudioOutput;
  displayMode: 'native' | 'fullscreen' | 'compact';
  appMode?: 'gametime' | 'studio';
  autoSkipIntro: boolean; // whether to automatically jump to preset start
  lockScreenArtwork: boolean;
}

export interface UnraidServerInfo {
  isDocker: boolean;
  hasUnraidMount: boolean;
  configDir: string;
  uptime: number;
  nodeVersion: string;
}

export interface GoalButtonConfig {
  id: number; // 1 to 20
  number: string; // 2-digit number (e.g., '07', '23', '99')
  athleteName: string; // Athlete / player name
  trackId?: string; // Assigned Track ID
  trackTitle?: string; // Assigned Track Title
  artist?: string; // Assigned Track Artist
  startTime?: number; // Starting cue offset in seconds (e.g. jump straight to chorus/drop)
  color?: string; // Accent color ('rose' | 'amber' | 'emerald' | 'sky' | 'indigo' | 'purple' | 'orange')
}

export interface TeamGoalSoundboard {
  id: string; // unique team id (e.g. 'team-home', 'team-away', 'team-1')
  name: string; // Team name (e.g. 'Home Roster', 'Away Team', 'Hawks', 'Oilers')
  color?: string; // Accent color for the team tab
  buttons: GoalButtonConfig[]; // 20 athlete buttons for this team
}

export interface ActiveGoalCelebration {
  buttonId: number;
  number: string;
  athleteName: string;
  trackTitle?: string;
  artist?: string;
  startTime?: number;
}

