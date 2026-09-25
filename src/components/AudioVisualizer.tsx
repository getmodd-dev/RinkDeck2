import { useEffect, useRef } from 'react';
import { GlobalAudioEngine } from '../utils/audioController';

interface AudioVisualizerProps {
  isPlaying: boolean;
  accentColor?: string;
}

export default function AudioVisualizer({ isPlaying, accentColor = '#38bdf8' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 48;

    const render = () => {
      const analyser = GlobalAudioEngine.getAnalyser();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = Math.max(2, (width / bars) - 2);
        const step = Math.floor(bufferLength / bars);

        for (let i = 0; i < bars; i++) {
          const value = dataArray[i * step] || 0;
          const percent = value / 255;
          const barHeight = Math.max(3, percent * height * 0.9);
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, '#ffffff');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Idle subtle pulse line
        const time = Date.now() / 1000;
        const barWidth = Math.max(2, (width / bars) - 2);
        for (let i = 0; i < bars; i++) {
          const wave = Math.sin(i * 0.2 + time * 2) * 0.5 + 0.5;
          const barHeight = 4 + wave * 6;
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, accentColor]);

  return (
    <div className="w-full h-12 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900/40 border border-slate-800/60 px-2">
      <canvas
        ref={canvasRef}
        width={360}
        height={48}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
