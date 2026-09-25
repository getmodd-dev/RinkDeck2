import { useState } from 'react';
import { Track, TrackMemory } from '../types';
import { formatTime } from '../utils/audioController';
import { X, RotateCcw, Info, Flag, CheckCircle2, Sliders, Trash2 } from 'lucide-react';

interface PositionMemoryModalProps {
  isOpen: boolean;
  rememberPosition?: boolean;
  changeTrackOnPause?: boolean;
  trackMemories: Record<string, TrackMemory>;
  tracks: Track[];
  currentTrackId?: string;
  currentTime?: number;
  onClose: () => void;
  onToggleRememberPosition?: (enabled: boolean) => void;
  onToggleChangeTrackOnPause?: (enabled: boolean) => void;
  onClearTrackMemory?: (trackId: string) => void;
  onClearAllMemories?: () => void;
  onJumpToTrackMemory?: (track: Track, position: number) => void;
  onSetTrackCuePoints?: (trackId: string, startPoint: number, endPoint: number) => void;
  onClearTrackCuePoints?: (trackId: string) => void;
}

export default function PositionMemoryModal({
  isOpen,
  changeTrackOnPause = true,
  trackMemories,
  tracks,
  currentTrackId,
  currentTime = 0,
  onClose,
  onToggleChangeTrackOnPause,
  onClearAllMemories,
  onSetTrackCuePoints,
  onClearTrackCuePoints,
}: PositionMemoryModalProps) {
  const [activeTab, setActiveTab] = useState<'bounds' | 'settings'>('bounds');

  if (!isOpen) return null;

  const configuredTracksCount = Object.values(trackMemories).filter(
    (mem) => (mem.startPoint !== undefined && mem.startPoint > 0) || (mem.endPoint !== undefined && mem.endPoint > 0)
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Preset Start & Endpoints
              </h2>
              <p className="text-xs text-slate-400">
                Tracks start from the beginning (0:00) unless a custom start point is set
              </p>
            </div>
          </div>
          <button
            id="btn-close-memory-modal"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 gap-2">
          <button
            id="tab-bounds"
            type="button"
            onClick={() => setActiveTab('bounds')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'bounds'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Preset Cue Points ({configuredTracksCount})</span>
          </button>

          <button
            id="tab-settings"
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-slate-900 text-sky-400 border-t-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Playback Behavior</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: PRESET BOUNDS & ENDPOINTS */}
          {activeTab === 'bounds' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Each track starts playing from <strong>0:00 (the beginning)</strong> unless you define a custom <strong>Starting Point [A]</strong>. When reaching <strong>Endpoint [B]</strong>, the track smoothly transitions to the next song.
                </p>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {tracks.map((track) => {
                  const mem = trackMemories[track.id];
                  const curStart = mem?.startPoint !== undefined ? mem.startPoint : (track.presetStart ?? 0);
                  const curEnd = mem?.endPoint !== undefined ? mem.endPoint : (track.presetEnd ?? track.duration);
                  const isCurrent = track.id === currentTrackId;

                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-slate-900 border-emerald-500/60 shadow-md'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {track.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {track.artist} • Total: {formatTime(track.duration)}
                          </span>
                        </div>

                        {/* Reset Bounds Button */}
                        {(curStart > 0 || curEnd < track.duration) && (
                          <button
                            type="button"
                            onClick={() => onClearTrackCuePoints?.(track.id)}
                            title="Reset to full track (0:00 to end)"
                            className="text-[11px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset (0:00)</span>
                          </button>
                        )}
                      </div>

                      {/* Start and End controls */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                        {/* Start Point Controls */}
                        <div className="p-2 rounded-lg bg-slate-900/90 border border-emerald-900/30 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <Flag className="w-3 h-3" /> Start [A]:
                            </span>
                            <span className="text-white font-bold">{formatTime(curStart)}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newStart = Math.max(0, curStart - 1);
                                onSetTrackCuePoints?.(track.id, newStart, curEnd);
                              }}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                            >
                              -1s
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newStart = Math.min(curEnd - 1, curStart + 1);
                                onSetTrackCuePoints?.(track.id, newStart, curEnd);
                              }}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                            >
                              +1s
                            </button>
                            {isCurrent && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSetTrackCuePoints?.(track.id, Math.floor(currentTime), curEnd);
                                }}
                                title="Set to current playhead"
                                className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                              >
                                Head
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onSetTrackCuePoints?.(track.id, 0, curEnd);
                              }}
                              title="Set starting point to beginning (0:00)"
                              className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              0:00
                            </button>
                          </div>
                        </div>

                        {/* End Point Controls */}
                        <div className="p-2 rounded-lg bg-slate-900/90 border border-rose-900/30 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[11px] text-rose-400 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> End [B]:
                            </span>
                            <span className="text-white font-bold">{formatTime(curEnd)}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newEnd = Math.max(curStart + 1, curEnd - 1);
                                onSetTrackCuePoints?.(track.id, curStart, newEnd);
                              }}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                            >
                              -1s
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newEnd = Math.min(track.duration, curEnd + 1);
                                onSetTrackCuePoints?.(track.id, curStart, newEnd);
                              }}
                              className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                            >
                              +1s
                            </button>
                            {isCurrent && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSetTrackCuePoints?.(track.id, curStart, Math.floor(currentTime));
                                }}
                                title="Set to current playhead"
                                className="px-1.5 py-0.5 text-[10px] rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                              >
                                Head
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onSetTrackCuePoints?.(track.id, curStart, track.duration);
                              }}
                              title="Set endpoint to track end"
                              className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              Max
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-3">
              {/* Feature Toggle Card: Change Track on Pause */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-white">
                    Change Song Every Time Paused
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Automatically skips to the next track in the playlist whenever playback is paused (tracks start clean from their beginning or preset starting point)
                  </div>
                </div>
                <button
                  id="btn-toggle-change-on-pause-switch"
                  type="button"
                  onClick={() => onToggleChangeTrackOnPause?.(!changeTrackOnPause)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative shrink-0 ${
                    changeTrackOnPause ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      changeTrackOnPause ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Reset all cue points */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Reset All Preset Cue Points
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Restores all tracks to start from 0:00 and play to their full natural duration
                  </div>
                </div>
                <button
                  id="btn-reset-all-cue-points"
                  type="button"
                  onClick={onClearAllMemories}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
