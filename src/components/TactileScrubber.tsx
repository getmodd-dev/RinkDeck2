import React, { useState, useRef } from 'react';
import { formatTime } from '../utils/audioController';
import { RotateCcw, Flag, CheckCircle2, Play, FastForward, X } from 'lucide-react';

interface TactileScrubberProps {
  currentTime: number;
  duration: number;
  rememberedPosition?: number;
  startPoint?: number;
  endPoint?: number;
  accentColor?: string;
  onSeek: (targetSeconds: number) => void;
  onResetToBeginning: () => void;
  onSetStartPoint?: (seconds: number) => void;
  onSetEndPoint?: (seconds: number) => void;
  onClearCuePoints?: () => void;
}

export default function TactileScrubber({
  currentTime,
  duration,
  rememberedPosition,
  startPoint,
  endPoint,
  accentColor = '#0284c7',
  onSeek,
  onResetToBeginning,
  onSetStartPoint,
  onSetEndPoint,
  onClearCuePoints,
}: TactileScrubberProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  const activeTime = dragTime !== null ? dragTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (activeTime / duration) * 100) : 0;
  
  const memoryPercent = (rememberedPosition && duration > 0 && rememberedPosition < duration)
    ? Math.min(100, (rememberedPosition / duration) * 100)
    : null;

  const startPercent = (startPoint !== undefined && duration > 0)
    ? Math.min(100, Math.max(0, (startPoint / duration) * 100))
    : null;

  const endPercent = (endPoint !== undefined && duration > 0)
    ? Math.min(100, Math.max(0, (endPoint / duration) * 100))
    : null;

  const calculateTimeFromEvent = (clientX: number): number => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = offsetX / rect.width;
    return ratio * duration;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    const newTime = calculateTimeFromEvent(e.clientX);
    setDragTime(newTime);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newTime = calculateTimeFromEvent(e.clientX);
    setDragTime(newTime);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      const finalTime = calculateTimeFromEvent(e.clientX);
      onSeek(finalTime);
      setIsDragging(false);
      setDragTime(null);
    }
  };

  // Preview jump to 5s before end point
  const handlePreviewEndPoint = () => {
    if (endPoint !== undefined && endPoint > 5) {
      onSeek(Math.max(0, endPoint - 4));
    } else if (duration > 5) {
      onSeek(Math.max(0, duration - 4));
    }
  };

  const hasCuePoints = (startPoint !== undefined && startPoint > 0) || (endPoint !== undefined && endPoint < duration);

  return (
    <div className="w-full select-none space-y-1">
      {/* Time display, active cue bounds & memory badge */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-mono text-slate-400 px-1">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-slate-100 text-sm sm:text-base">
            {formatTime(activeTime)}
          </span>

          {/* Active Preset Bounds Chip */}
          {hasCuePoints && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-[10px] sm:text-[11px]">
              <span className="font-bold text-emerald-400">PRESET:</span>
              <span>{formatTime(startPoint ?? 0)}</span>
              <span className="text-emerald-500">➔</span>
              <span>{formatTime(endPoint ?? duration)}</span>
              {onClearCuePoints && (
                <button
                  id="btn-clear-cue-points-badge"
                  type="button"
                  onClick={onClearCuePoints}
                  title="Reset preset cue points to track defaults"
                  className="hover:text-emerald-100 ml-0.5 p-0.5"
                >
                  <X className="w-3 h-3 text-emerald-400 hover:text-emerald-200" />
                </button>
              )}
            </div>
          )}

          {/* Restart / Reset to start button */}
          {activeTime > 5 && (
            <button
              id="btn-jump-to-start"
              type="button"
              onClick={onResetToBeginning}
              title={startPoint && startPoint > 0 ? `Reset to Preset Start (${formatTime(startPoint)})` : 'Restart from beginning (0:00)'}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700 active:scale-95"
            >
              <RotateCcw className="w-2.5 h-2.5 text-sky-400" />
              <span>{startPoint && startPoint > 0 ? `Restart @ ${formatTime(startPoint)}` : 'Restart (0:00)'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {endPoint && endPoint < duration && (
            <span className="text-rose-400/90 flex items-center gap-1">
              <span>End:</span>
              <span className="font-bold">{formatTime(endPoint)}</span>
            </span>
          )}
          <span className="text-slate-500">
            -{formatTime(Math.max(0, (endPoint ?? duration) - activeTime))}
          </span>
          <span className="text-slate-400 font-medium">
            / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Touch-optimized Scrubber Bar */}
      <div
        id="touch-scrubber-hitbox"
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsDragging(false);
          setDragTime(null);
        }}
        className="relative h-8 sm:h-9 flex items-center cursor-pointer touch-none group"
      >
        {/* Floating preview bubble when dragging on touch screen */}
        {isDragging && dragTime !== null && (
          <div
            className="absolute -top-7 transform -translate-x-1/2 px-2.5 py-1 rounded bg-slate-900 border border-sky-400 text-sky-300 text-xs font-mono font-bold shadow-lg pointer-events-none z-30"
            style={{ left: `${progressPercent}%` }}
          >
            {formatTime(dragTime)}
          </div>
        )}

        {/* Outer track line */}
        <div className="w-full h-3.5 sm:h-4 bg-slate-800/90 rounded-full overflow-hidden relative shadow-inner border border-slate-700/50">
          {/* Active Preset Playable Window Region */}
          {startPercent !== null && (
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/15 border-l-2 border-r-2 border-emerald-400/60 pointer-events-none z-0"
              style={{
                left: `${startPercent}%`,
                width: `${(endPercent ?? 100) - startPercent}%`,
              }}
            />
          )}

          {/* Active progress fill */}
          <div
            className="h-full transition-[width] duration-75 ease-out rounded-l-full relative"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: accentColor,
            }}
          >
            {/* Shimmer line inside progress */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>

          {/* Position Memory marker indicator */}
          {memoryPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              style={{ left: `${memoryPercent}%` }}
              title={`Saved memory position: ${formatTime(rememberedPosition!)}`}
            />
          )}

          {/* Preset Start Location [A] Marker */}
          {startPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-emerald-400 z-15 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              style={{ left: `${startPercent}%` }}
              title={`Preset Start: ${formatTime(startPoint!)}`}
            />
          )}

          {/* Preset End Location [B] Marker */}
          {endPercent !== null && (
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-rose-500 z-15 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${endPercent}%` }}
              title={`Preset Endpoint: ${formatTime(endPoint!)}`}
            />
          )}
        </div>

        {/* Large Tactile Thumb for Pi Touchscreen */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] border-2 border-slate-900 flex items-center justify-center transition-transform active:scale-125 z-20 pointer-events-none"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>
      </div>

      {/* Tactile Cue Points Toolbar (Quick touch buttons to set preset start & endpoint) */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 pt-0.5 select-none overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {/* Set Start Point (In / A) */}
          <button
            id="btn-set-start-point"
            type="button"
            onClick={() => onSetStartPoint?.(Math.floor(activeTime))}
            title="Set preset start location to current playhead"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all active:scale-95 ${
              startPoint !== undefined && Math.abs(startPoint - activeTime) < 1
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border-emerald-800/40'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>SET START [A]:</span>
            <span className="font-bold text-white">
              {startPoint !== undefined ? formatTime(startPoint) : '0:00'}
            </span>
          </button>

          {/* Jump to Preset Start */}
          {startPoint !== undefined && startPoint > 0 && (
            <button
              id="btn-jump-to-preset-start"
              type="button"
              onClick={() => onSeek(startPoint)}
              title={`Jump to preset start (${formatTime(startPoint)})`}
              className="px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 active:scale-95 flex items-center gap-1"
            >
              <Play className="w-3 h-3 text-emerald-400 fill-current" />
              <span>Go In</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Set End Point (Out / B) */}
          <button
            id="btn-set-end-point"
            type="button"
            onClick={() => onSetEndPoint?.(Math.floor(activeTime))}
            title="Set preset endpoint to current playhead"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all active:scale-95 ${
              endPoint !== undefined && Math.abs(endPoint - activeTime) < 1
                ? 'bg-rose-500 text-slate-950 border-rose-400 font-bold shadow-sm'
                : 'bg-slate-900/90 hover:bg-slate-800 text-rose-400 border-rose-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
            <span>SET END [B]:</span>
            <span className="font-bold text-white">
              {endPoint !== undefined ? formatTime(endPoint) : formatTime(duration)}
            </span>
          </button>

          {/* Preview End Transition */}
          <button
            id="btn-preview-endpoint"
            type="button"
            onClick={handlePreviewEndPoint}
            title="Jump to 4s before endpoint to preview the track transition"
            className="px-2 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 active:scale-95 flex items-center gap-1"
          >
            <FastForward className="w-3 h-3 text-rose-400" />
            <span>Test Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
