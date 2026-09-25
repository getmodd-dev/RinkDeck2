import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Sparkles,
  Dices,
  Zap,
  Trophy,
} from 'lucide-react';
import { ShuffleMode, RepeatMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  shuffleMode: ShuffleMode;
  repeatMode: RepeatMode;
  changeTrackOnPause: boolean;
  isBuffering: boolean;
  accentColor?: string;
  onOpenGoalModal?: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeekRelative: (seconds: number) => void;
  onCycleShuffle: () => void;
  onCycleRepeat: () => void;
  onReshuffleQueue: () => void;
  onToggleChangeOnPause: () => void;
}

export default function PlayerControls({
  isPlaying,
  shuffleMode,
  repeatMode,
  changeTrackOnPause,
  isBuffering,
  accentColor = '#0284c7',
  onOpenGoalModal,
  onTogglePlay,
  onPrev,
  onNext,
  onSeekRelative,
  onCycleShuffle,
  onCycleRepeat,
  onReshuffleQueue,
  onToggleChangeOnPause,
}: PlayerControlsProps) {
  return (
    <div className="w-full flex flex-col items-center gap-2">
      {/* Primary transport row */}
      <div className="w-full flex items-center justify-between sm:justify-center gap-2 sm:gap-4 px-1">
        {/* Shuffle Mode Button */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-shuffle-mode"
            type="button"
            onClick={onCycleShuffle}
            title={`Shuffle Mode: ${shuffleMode.toUpperCase()} (Tap to change)`}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
              shuffleMode !== 'off'
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {shuffleMode === 'smart' ? (
              <div className="flex items-center">
                <Shuffle className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-mono px-1 py-0.2 rounded bg-sky-500 text-slate-950 font-bold">
                  SMART
                </span>
              </div>
            ) : shuffleMode === 'random' ? (
              <div className="flex items-center">
                <Dices className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                  RND
                </span>
              </div>
            ) : (
              <Shuffle className="w-5 h-5 opacity-60" />
            )}
          </button>

          {/* Instant Reshuffle Action Button (shows when shuffle active) */}
          {shuffleMode !== 'off' && (
            <button
              id="btn-reshuffle-now"
              type="button"
              onClick={onReshuffleQueue}
              title="Reshuffle remaining queue now"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800/80 text-sky-300 hover:text-white border border-sky-500/30 flex items-center justify-center transition-all active:rotate-180 duration-200"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Previous Track */}
        <button
          id="btn-prev-track"
          type="button"
          onClick={onPrev}
          title="Previous Track"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/70 flex items-center justify-center shadow-md transition-all shrink-0"
        >
          <SkipBack className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
        </button>

        {/* -15s Jump */}
        <button
          id="btn-rewind-15"
          type="button"
          onClick={() => onSeekRelative(-15)}
          title="Rewind 15 seconds"
          className="hidden md:flex w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800/70 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/50 items-center justify-center relative transition-all shrink-0"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute text-[8px] font-bold font-mono top-1/2 -translate-y-1/2">
            15
          </span>
        </button>

        {/* Primary Play / Pause (Large 80-88px target for 7-inch Pi Touchscreen) */}
        <button
          id="btn-play-pause-main"
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          className="w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 border-4 border-white/30 hover:border-white/50 relative shrink-0 shadow-[0_0_25px_rgba(2,132,199,0.35)] cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          {isBuffering ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-10 h-10 sm:w-11 sm:h-11 text-white fill-current" />
          ) : (
            <Play className="w-10 h-10 sm:w-11 sm:h-11 text-white fill-current translate-x-1" />
          )}
        </button>

        {/* +15s Jump */}
        <button
          id="btn-forward-15"
          type="button"
          onClick={() => onSeekRelative(15)}
          title="Forward 15 seconds"
          className="hidden md:flex w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-800/70 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/50 items-center justify-center relative transition-all shrink-0"
        >
          <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute text-[8px] font-bold font-mono top-1/2 -translate-y-1/2">
            15
          </span>
        </button>

        {/* Next Track */}
        <button
          id="btn-next-track"
          type="button"
          onClick={onNext}
          title="Next Track"
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/70 flex items-center justify-center shadow-md transition-all shrink-0"
        >
          <SkipForward className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
        </button>

        {/* Repeat Mode Button */}
        <button
          id="btn-repeat-mode"
          type="button"
          onClick={onCycleRepeat}
          title={`Repeat: ${repeatMode.toUpperCase()} (Tap to change)`}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${
            repeatMode !== 'off'
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.2)]'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
          }`}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="w-5 h-5 text-amber-400" />
          ) : repeatMode === 'all' ? (
            <Repeat className="w-5 h-5" />
          ) : (
            <Repeat className="w-5 h-5 opacity-60" />
          )}
        </button>
      </div>

      {/* Touch Sub-row: Auto-Change Track On Pause & Goal Soundboard */}
      <div className="flex items-center justify-center gap-2 select-none flex-wrap">
        {/* Goal Pop Up Trigger */}
        {onOpenGoalModal && (
          <button
            id="btn-player-controls-goal"
            type="button"
            onClick={onOpenGoalModal}
            title="Open Goal Soundboard with 20 Programmable Athlete Buttons"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold border transition-all active:scale-95 bg-rose-950/70 text-rose-300 border-rose-500/50 hover:bg-rose-900/80 shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-rose-400" />
            <span>GOAL (20)</span>
          </button>
        )}

        <button
          id="btn-toggle-change-on-pause"
          type="button"
          onClick={onToggleChangeOnPause}
          title="When active, pausing automatically switches to the next song in the playlist"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] border transition-all active:scale-95 ${
            changeTrackOnPause
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm font-semibold'
              : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${changeTrackOnPause ? 'fill-current text-amber-400' : ''}`} />
          <span>CHANGE ON PAUSE:</span>
          <span className="font-bold">{changeTrackOnPause ? 'ACTIVE' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
}
