import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1, Sliders } from 'lucide-react';

interface VolumeAndToneBarProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (newVol: number) => void;
  onToggleMute: () => void;
  onToneChange?: (bassGain: number, trebleGain: number) => void;
}

export default function VolumeAndToneBar({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onToneChange,
}: VolumeAndToneBarProps) {
  const [showToneDrawer, setShowToneDrawer] = useState(false);
  const [bass, setBass] = useState(0); // -10 to +10 dB
  const [treble, setTreble] = useState(0);

  const handleBass = (val: number) => {
    setBass(val);
    onToneChange?.(val, treble);
  };

  const handleTreble = (val: number) => {
    setTreble(val);
    onToneChange?.(bass, val);
  };

  const effectiveVol = isMuted ? 0 : volume;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Volume Row */}
      <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
        {/* Mute / Unmute Button (40px target) */}
        <button
          id="btn-toggle-mute"
          type="button"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-colors border border-slate-700/60 shrink-0"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : volume < 0.5 ? (
            <Volume1 className="w-4 h-4 text-slate-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-sky-400" />
          )}
        </button>

        {/* Tactile Range Slider */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span>VOLUME</span>
            <span className="font-bold text-slate-200">{Math.round(effectiveVol * 100)}%</span>
          </div>
          <input
            id="input-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={effectiveVol}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 touch-none"
          />
        </div>

        {/* Quick Volume Preset Taps */}
        <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-slate-400">
          {[
            { label: '25%', val: 0.25 },
            { label: '50%', val: 0.50 },
            { label: '75%', val: 0.75 },
            { label: 'MAX', val: 1.0 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onVolumeChange(preset.val)}
              className="px-2 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-[11px] font-semibold text-slate-300 hover:text-white border border-slate-700/50"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Tone EQ Drawer Toggle */}
        <button
          id="btn-toggle-tone"
          type="button"
          onClick={() => setShowToneDrawer(!showToneDrawer)}
          title="Hardware Tone Controls (Bass & Treble)"
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors border ${
            showToneDrawer
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
          }`}
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>

      {/* Tone Controls (Pi Hi-Fi Bass / Treble Shelf) */}
      {showToneDrawer && (
        <div className="grid grid-cols-2 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>BASS BOOST</span>
              <span className="text-sky-300 font-bold">{bass > 0 ? `+${bass}` : bass} dB</span>
            </div>
            <input
              type="range"
              min="-8"
              max="10"
              step="1"
              value={bass}
              onChange={(e) => handleBass(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400 touch-none"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
              <span>TREBLE BOOST</span>
              <span className="text-sky-300 font-bold">{treble > 0 ? `+${treble}` : treble} dB</span>
            </div>
            <input
              type="range"
              min="-8"
              max="10"
              step="1"
              value={treble}
              onChange={(e) => handleTreble(parseInt(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400 touch-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
