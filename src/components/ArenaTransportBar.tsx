import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Shuffle,
} from 'lucide-react';
import { Track } from '../types';
import { formatTime } from '../utils/audioController';

interface ArenaTransportBarProps {
  currentTrack?: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffleMode: string;
  onTogglePlay: () => void;
  onStop: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (seconds: number) => void;
  onCycleShuffle: () => void;
}

export default function ArenaTransportBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  shuffleMode,
  onTogglePlay,
  onStop,
  onNextTrack,
  onPrevTrack,
  onSeek,
  onCycleShuffle,
}: ArenaTransportBarProps) {
  return (
    <div className="shrink-0 bg-slate-900/95 rounded-2xl border border-slate-800/90 p-3 flex flex-col gap-2 shadow-lg select-none">
      {/* Track Title & Artist */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
            {isPlaying && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            )}
            <span className="truncate">{currentTrack?.title || 'No Track Playing'}</span>
          </div>
          <div className="text-xs text-slate-400 truncate">
            {currentTrack?.artist || 'Select a song or player celebration to begin'}
          </div>
        </div>
        <div className="font-mono text-xs font-bold text-slate-300 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Tactile Scrubber Bar */}
      <div className="w-full px-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-sky-400"
        />
      </div>

      {/* Primary Controls Row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Left: Shuffle Mode */}
        <button
          type="button"
          onClick={onCycleShuffle}
          title={`Shuffle: ${shuffleMode.toUpperCase()}`}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer ${
            shuffleMode !== 'off'
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SHUFFLE:</span>
          <span>{shuffleMode === 'smart' ? 'SMART' : shuffleMode === 'random' ? 'RND' : 'OFF'}</span>
        </button>

        {/* Center: Prev, Stop, Large Play/Pause, Next */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onPrevTrack}
            title="Cue Previous Track (Ready on Deck)"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            type="button"
            onClick={onStop}
            title="Stop Playback"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-950/70 hover:bg-rose-900 active:scale-95 text-rose-300 flex items-center justify-center border border-rose-500/40 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/30 border-2 border-sky-300 font-bold transition-transform cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNextTrack}
            title="Cue Next Track (Ready on Deck)"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Right: Manual Skip Indicator or Spacer */}
        <div className="flex items-center text-xs font-mono text-slate-400">
          <span>PAUSE = STOP</span>
        </div>
      </div>
    </div>
  );
}
