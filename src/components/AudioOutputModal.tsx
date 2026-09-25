import { AudioOutput } from '../types';
import { Volume2, Check, Radio, Disc, Sparkles, X } from 'lucide-react';

interface AudioOutputModalProps {
  isOpen: boolean;
  currentOutput: AudioOutput;
  onClose: () => void;
  onSelectOutput: (output: AudioOutput) => void;
}

const OUTPUT_OPTIONS: {
  id: AudioOutput;
  title: string;
  desc: string;
  badge: string;
  icon: any;
}[] = [
  {
    id: 'ipad',
    title: 'iPad Stereo Speakers / Audio Jack',
    desc: 'Direct audio playback through iPad built-in speakers or 3.5mm headphone jack',
    badge: 'IPAD NATIVE',
    icon: Volume2,
  },
  {
    id: 'airplay',
    title: 'AirPlay / Control Center',
    desc: 'Route playback wirelessly from iPad to AirPlay speakers, HomePods, or Unraid Shairport',
    badge: 'AIRPLAY',
    icon: Radio,
  },
  {
    id: 'dac',
    title: 'USB DAC / Audio Interface',
    desc: 'Direct USB audio pass-through with lossless 24-bit / 96kHz or 192kHz decoding',
    badge: 'HI-FI BITPERFECT',
    icon: Disc,
  },
  {
    id: 'bluetooth',
    title: 'Bluetooth Audio Sink',
    desc: 'Wireless audio streaming to paired Bluetooth speakers or AirPods',
    badge: 'WIRELESS',
    icon: Sparkles,
  },
  {
    id: 'analog',
    title: 'Auxiliary 3.5mm Analog Out',
    desc: 'Direct analog line output to stereo receiver or amplified monitor speakers',
    badge: 'ANALOG OUT',
    icon: Volume2,
  },
];

export default function AudioOutputModal({
  isOpen,
  currentOutput,
  onClose,
  onSelectOutput,
}: AudioOutputModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Audio Output Destination
              </h2>
              <p className="text-xs text-slate-400">
                Route audio to iPad speakers, AirPlay, USB DAC, or Bluetooth
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

        {/* List of outputs */}
        <div className="p-4 space-y-2.5">
          {OUTPUT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = currentOutput === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => onSelectOutput(opt.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/60 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {opt.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold active:scale-95 transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
