import React, { memo } from 'react';
import { Track, GoalButtonConfig, ActiveGoalCelebration } from '../types';
import { Square, Radio, Flame, Music, Volume2 } from 'lucide-react';

interface ArenaGoalDeckProps {
  goalButtons: GoalButtonConfig[];
  currentTrack?: Track;
  isPlaying?: boolean;
  activeCelebration?: ActiveGoalCelebration | null;
  onSelectAthlete: (btn: GoalButtonConfig) => void;
  onStopCelebration?: () => void;
}

// Memoized individual athlete button for ultra-smooth 60fps interaction
const AthleteButton = memo(function AthleteButton({
  btn,
  isCurrentlyCelebrating,
  onClick,
}: {
  btn: GoalButtonConfig;
  isCurrentlyCelebrating: boolean;
  onClick: () => void;
}) {
  const hasTrack = Boolean(btn.trackId || btn.trackTitle);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col justify-between p-3 rounded-2xl text-left border transition-all active:scale-95 select-none cursor-pointer overflow-hidden ${
        isCurrentlyCelebrating
          ? 'bg-rose-950/95 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] ring-2 ring-rose-400'
          : hasTrack
          ? 'bg-slate-900/90 hover:bg-slate-800/95 border-slate-700/80 hover:border-slate-500 shadow-sm'
          : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/60 text-slate-500'
      }`}
    >
      {/* Top: Jersey Number & Active Pulse Indicator */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`font-mono font-black text-2xl sm:text-3xl leading-none ${
            isCurrentlyCelebrating
              ? 'text-rose-300'
              : hasTrack
              ? 'text-white'
              : 'text-slate-500'
          }`}
        >
          #{btn.number}
        </span>
        {isCurrentlyCelebrating && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-900/80 px-1 rounded animate-pulse">
              FIRING
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
          </div>
        )}
      </div>

      {/* Bottom: Player Name & Track Title */}
      <div className="mt-2 w-full min-w-0">
        <div
          className={`text-sm sm:text-base font-bold truncate leading-tight ${
            isCurrentlyCelebrating
              ? 'text-white'
              : hasTrack
              ? 'text-slate-200'
              : 'text-slate-500'
          }`}
        >
          {btn.athleteName || `Player #${btn.number}`}
        </div>
        <div
          className={`text-xs font-mono truncate mt-1 leading-none ${
            isCurrentlyCelebrating
              ? 'text-rose-300 font-bold'
              : 'text-slate-400'
          }`}
        >
          {isCurrentlyCelebrating
            ? 'TAP TO CUT GOAL'
            : btn.trackTitle || 'No Song Assigned'}
        </div>
      </div>
    </button>
  );
});

export default function ArenaGoalDeck({
  goalButtons,
  activeCelebration,
  onSelectAthlete,
  onStopCelebration,
}: ArenaGoalDeckProps) {
  return (
    <div className="h-full min-h-0 bg-slate-950/60 rounded-2xl border border-slate-800/80 p-2 sm:p-3 flex flex-col gap-2 overflow-hidden">
      {/* Active Goal Celebration Soundboard Banner (Decoupled from Transport Bar) */}
      {activeCelebration && (
        <div className="shrink-0 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 rounded-xl p-2.5 px-3.5 text-white flex items-center justify-between gap-3 shadow-lg shadow-rose-900/40 border border-rose-400/60 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-200 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-black/30 px-1.5 py-0.5 rounded text-amber-200 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> GOAL CELEBRATION
                </span>
                <span className="text-xs sm:text-sm font-black font-mono tracking-tight truncate">
                  #{activeCelebration.number} {activeCelebration.athleteName.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-rose-100 truncate flex items-center gap-1 font-mono">
                <Music className="w-3 h-3 opacity-80 shrink-0" />
                <span className="truncate">{activeCelebration.trackTitle || 'Goal Horn Blast'}</span>
                <span className="text-white/60 hidden sm:inline">&bull; (Fresh track on deck)</span>
              </div>
            </div>
          </div>

          {onStopCelebration && (
            <button
              type="button"
              onClick={onStopCelebration}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-black text-rose-300 hover:text-white border border-white/30 text-xs font-mono font-black shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
              <span>CUT GOAL</span>
            </button>
          )}
        </div>
      )}

      {/* 20 Athlete Buttons Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 h-full">
          {goalButtons.map((btn) => {
            const isCurrentlyCelebrating = Boolean(
              activeCelebration && activeCelebration.buttonId === btn.id
            );
            return (
              <AthleteButton
                key={btn.id}
                btn={btn}
                isCurrentlyCelebrating={isCurrentlyCelebrating}
                onClick={() => onSelectAthlete(btn)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
