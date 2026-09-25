import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Bell,
  Sliders,
  Users,
  Plus,
  Flame,
  Clock,
  Trash2,
  Server,
} from 'lucide-react';
import { TeamGoalSoundboard } from '../types';
import { playGoalHorn } from '../utils/goalHorn';

interface RinkDeckHeaderProps {
  teams: TeamGoalSoundboard[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onAddTeam: () => void;
  onDeleteTeam?: (teamId: string) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onPanicMute: () => void;
  playHornOnPlayerSelect: boolean;
  onToggleHornOnPlayerSelect: (enabled: boolean) => void;
  onOpenProgramRoster: () => void;
  onOpenPlexModal?: () => void;
  activeFormat?: string;
}

// Compact Live Clock Component
function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      title="Current Arena Time"
      className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black text-slate-100 tracking-wider bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 shadow-inner shrink-0"
    >
      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      <span>{time || '00:00:00'}</span>
    </div>
  );
}

export default function RinkDeckHeader({
  teams,
  activeTeamId,
  onSelectTeam,
  onAddTeam,
  onDeleteTeam,
  volume,
  isMuted,
  onVolumeChange,
  onPanicMute,
  playHornOnPlayerSelect,
  onToggleHornOnPlayerSelect,
  onOpenProgramRoster,
  onOpenPlexModal,
}: RinkDeckHeaderProps) {
  return (
    <header className="w-full h-11 bg-slate-950/95 border-b border-slate-800/90 px-2 sm:px-3 flex items-center justify-between gap-1.5 sm:gap-2 select-none shrink-0 z-20 overflow-hidden whitespace-nowrap">
      {/* Left: Brand Tag, Live Clock, and Team Selector (Single Row) */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink overflow-x-auto scrollbar-none">
        {/* Brand */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-950/70 border border-sky-600/40 text-sky-300 font-black text-xs tracking-wider shadow-sm shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>RINKDECK</span>
        </div>

        {/* Live Clock */}
        <LiveClock />

        {/* Team Tabs (Scrollable horizontally if many teams) */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 shrink min-w-0 overflow-x-auto scrollbar-none">
          <Users className="w-3 h-3 text-slate-500 ml-1 mr-0.5 hidden xl:inline shrink-0" />
          {teams.map((team) => {
            const isActive = team.id === activeTeamId;
            return (
              <div
                key={team.id}
                className={`flex items-center rounded-md transition-all shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTeam(team.id)}
                  title={`Switch to ${team.name}`}
                  className="px-2 py-0.5 text-xs font-mono font-bold cursor-pointer truncate max-w-[110px]"
                >
                  {team.name}
                </button>
                {teams.length > 1 && onDeleteTeam && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete team "${team.name}"? This will remove this roster.`)) {
                        onDeleteTeam(team.id);
                      }
                    }}
                    title={`Delete ${team.name}`}
                    className={`p-0.5 mr-0.5 rounded hover:bg-black/30 transition-colors cursor-pointer ${
                      isActive ? 'text-rose-200 hover:text-white' : 'text-slate-500 hover:text-rose-400'
                    }`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={onAddTeam}
            title="Add New Team Roster"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Controls: Compact Single-Row Action Icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Master Volume Slider */}
        <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onPanicMute}
            title={isMuted ? 'Muted — Click to unmute' : 'Mute audio'}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            title={`Master Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            className="w-14 sm:w-20 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-sky-400"
          />
        </div>

        {/* Referee / Whistle PANIC MUTE Button */}
        <button
          type="button"
          onClick={onPanicMute}
          title="PANIC MUTE — Instantly kill all audio for whistles & ref calls"
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-black text-xs border transition-all active:scale-95 cursor-pointer shadow-sm shrink-0 ${
            isMuted
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
              : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-600/50 hover:border-rose-400'
          }`}
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isMuted ? 'UNMUTE' : 'MUTE'}</span>
        </button>

        {/* Program Roster Button */}
        <button
          type="button"
          onClick={onOpenProgramRoster}
          title="Program Roster: Names, Numbers & Goal Songs"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">ROSTER</span>
        </button>

        {/* Plex Integration Button */}
        {onOpenPlexModal && (
          <button
            type="button"
            onClick={onOpenPlexModal}
            title="Plex Media Server — Connect & stream audio library"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">PLEX</span>
          </button>
        )}

        {/* Horn on Player Select Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleHornOnPlayerSelect(!playHornOnPlayerSelect)}
          title="Blast stadium horn when athlete celebration is triggered"
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 cursor-pointer shrink-0 ${
            playHornOnPlayerSelect
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${playHornOnPlayerSelect ? 'text-amber-400' : 'text-slate-500'}`} />
          <span className="text-[10px] font-black">{playHornOnPlayerSelect ? 'HORN ON' : 'OFF'}</span>
        </button>

        {/* High-Contrast Goal Horn Blast Button */}
        <button
          type="button"
          onClick={() => playGoalHorn()}
          title="Blast Stadium Goal Horn"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-95 text-white font-mono font-black text-xs border border-rose-400/80 shadow-md shadow-rose-600/30 cursor-pointer transition-all shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
          <span>GOAL HORN</span>
        </button>
      </div>
    </header>
  );
}
