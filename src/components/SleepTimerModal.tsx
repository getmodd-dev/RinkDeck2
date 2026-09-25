import { Moon, Sun, X, Check, Timer } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  activeTimerMinutes: number | null; // null = off, -1 = end of track, or minutes
  remainingSeconds: number | null;
  dimmerLevel: number; // 0 to 80
  onClose: () => void;
  onSetTimer: (minutes: number | null) => void;
  onChangeDimmer: (level: number) => void;
}

const TIMER_PRESETS = [
  { label: 'Off', val: null },
  { label: '15 Min', val: 15 },
  { label: '30 Min', val: 30 },
  { label: '45 Min', val: 45 },
  { label: '60 Min', val: 60 },
  { label: 'End of Track', val: -1 },
];

export default function SleepTimerModal({
  isOpen,
  activeTimerMinutes,
  remainingSeconds,
  dimmerLevel,
  onClose,
  onSetTimer,
  onChangeDimmer,
}: SleepTimerModalProps) {
  if (!isOpen) return null;

  const formatRemaining = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Sleep Timer & Display Dimmer
              </h2>
              <p className="text-xs text-slate-400">
                Night mode & automatic playback shutdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* Sleep Timer Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono font-bold text-slate-400">
                AUTO-STOP TIMER
              </span>
              {remainingSeconds !== null && remainingSeconds > 0 && (
                <span className="text-xs font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-950/60 border border-purple-600/40 animate-pulse">
                  Stopping in: {formatRemaining(remainingSeconds)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TIMER_PRESETS.map((preset) => {
                const isSelected = activeTimerMinutes === preset.val;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onSetTimer(preset.val)}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Screen Dimmer Section */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">SCREEN DIMMER OVERLAY</span>
              </div>
              <span className="text-white font-bold">{dimmerLevel}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={dimmerLevel}
              onChange={(e) => onChangeDimmer(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 touch-none"
            />
            <p className="text-[11px] text-slate-500">
              Dimmers the display for nighttime bed or vehicle listening without turning off the Pi display backlight.
            </p>
          </div>
        </div>

        {/* Footer */}
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
