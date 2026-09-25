import { useState, useEffect } from 'react';
import {
  Clock,
  Cpu,
  Volume2,
  Moon,
  Flag,
  Maximize2,
  Tv,
  Monitor,
  HardDrive,
  Trophy,
  Zap,
} from 'lucide-react';
import { AudioOutput } from '../types';

interface TopStatusBarProps {
  outputDevice: AudioOutput;
  activeTrackFormat?: string;
  hasSavedMemoriesCount: number;
  rememberPositionEnabled?: boolean;
  displayMode: 'native' | 'fullscreen' | 'compact';
  onSwitchToGameTime?: () => void;
  onOpenGoalModal: () => void;
  onOpenOutputModal: () => void;
  onOpenSleepTimer: () => void;
  onOpenMemoryModal: () => void;
  onChangeDisplayMode: (mode: 'native' | 'fullscreen' | 'compact') => void;
  onToggleFullscreen: () => void;
}

export default function TopStatusBar({
  outputDevice,
  activeTrackFormat = '44.1kHz / 16-bit',
  hasSavedMemoriesCount,
  rememberPositionEnabled,
  displayMode,
  onSwitchToGameTime,
  onOpenGoalModal,
  onOpenOutputModal,
  onOpenSleepTimer,
  onOpenMemoryModal,
  onChangeDisplayMode,
  onToggleFullscreen,
}: TopStatusBarProps) {
  const [time, setTime] = useState<string>('');
  const [cpuTemp, setCpuTemp] = useState<number>(44.2);

  // Clock update
  useEffect(() => {
    const updateTime = () => {
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
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtle realistic fluctuation for Pi / Unraid hardware status
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuTemp((prev) => {
        const delta = (Math.random() - 0.5) * 0.4;
        return parseFloat((Math.max(42.0, Math.min(49.0, prev + delta))).toFixed(1));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getOutputLabel = (out: AudioOutput) => {
    switch (out) {
      case 'ipad':
        return 'iPad Speaker';
      case 'airplay':
        return 'AirPlay';
      case 'dac':
        return 'USB DAC';
      case 'hdmi':
        return 'HDMI';
      case 'analog':
        return '3.5mm';
      case 'bluetooth':
        return 'Bluetooth';
      default:
        return 'Audio Out';
    }
  };

  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-sm border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-xs select-none z-20">
      {/* Left: Brand & Server Stats */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* RinkDeck Player Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-950/60 border border-sky-800/50 text-sky-300 font-semibold text-[11px] tracking-wide">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>RINKDECK • UNRAID</span>
        </div>

        {/* Game Time Switcher Button */}
        {onSwitchToGameTime && (
          <button
            id="btn-statusbar-gametime"
            type="button"
            onClick={onSwitchToGameTime}
            title="Switch to Simple Game Time Interface"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-mono font-bold text-[11px] shadow-sm shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Zap className="w-3 h-3 fill-current text-amber-300" />
            <span>GAME TIME</span>
          </button>
        )}

        {/* Audio Engine Quality */}
        <div className="hidden sm:flex items-center gap-1 font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
          <span className="text-[10px] text-sky-400 font-bold">SOURCE</span>
          <span className="text-[11px] text-slate-300">{activeTrackFormat}</span>
        </div>
      </div>

      {/* Center: High-Contrast Touch Digital Clock */}
      <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold text-slate-100 tracking-wider bg-slate-900/80 px-3 py-0.5 rounded-lg border border-slate-800 shadow-sm">
        <Clock className="w-4 h-4 text-sky-400" />
        <span>{time || '00:00:00'}</span>
      </div>

      {/* Right: Touch Shortcuts */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* GOAL Soundboard (20 Programmable Athlete Buttons) */}
        <button
          id="btn-open-goal-modal"
          type="button"
          onClick={onOpenGoalModal}
          title="Goal Horn & Athlete Songs Soundboard (20 Programmable Buttons)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all active:scale-95 bg-rose-950/70 border-rose-500/60 text-rose-300 hover:bg-rose-900/80 shadow-sm shadow-rose-950/50"
        >
          <Trophy className="w-3.5 h-3.5 text-rose-400" />
          <span>GOAL</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        </button>

        {/* Track Preset Bounds (Start & Endpoints) Manager Button */}
        <button
          id="btn-open-memory-modal"
          type="button"
          onClick={onOpenMemoryModal}
          title="Track Preset Start & Endpoints Manager"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-all active:scale-95 ${
            hasSavedMemoriesCount > 0
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Flag className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">CUE BOUNDS:</span>
          <span className="font-bold">
            {hasSavedMemoriesCount > 0 ? `${hasSavedMemoriesCount} SET` : 'DEFAULT'}
          </span>
        </button>

        {/* Audio Output Selector */}
        <button
          id="btn-select-audio-out"
          type="button"
          onClick={onOpenOutputModal}
          title="Audio Output Device"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-[11px] font-mono transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">{getOutputLabel(outputDevice)}</span>
        </button>

        {/* Sleep Timer / Screen Dimmer */}
        <button
          id="btn-open-sleep-timer"
          type="button"
          onClick={onOpenSleepTimer}
          title="Sleep Timer & Screen Dimmer"
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Display Frame / Pi Aspect Ratio Toggle */}
        <div className="hidden sm:flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
          <button
            type="button"
            onClick={() => onChangeDisplayMode('native')}
            title="Native Pi 7-inch (800x480) Frame"
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              displayMode === 'native' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pi 7"
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayMode('compact')}
            title="Waveshare 1024x600 Frame"
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              displayMode === 'compact' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1024
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayMode('fullscreen')}
            title="Fluid Fullscreen Display"
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              displayMode === 'fullscreen' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Full
          </button>
        </div>

        {/* Fullscreen Trigger */}
        <button
          id="btn-toggle-fullscreen"
          type="button"
          onClick={onToggleFullscreen}
          title="Toggle Kiosk Fullscreen Mode"
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
