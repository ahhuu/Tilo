import React, { useRef, useEffect } from 'react';
import type { AmbientSoundType } from '@/core/audio/ambientAudioService';

interface AmbientBackgroundVisualizerProps {
  soundType: AmbientSoundType;
  isPaused: boolean;
  className?: string;
}

export const AmbientBackgroundVisualizer: React.FC<AmbientBackgroundVisualizerProps> = ({
  soundType,
  isPaused,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // --- Rain Particles ---
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }
    const rainDrops: RainDrop[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 18,
      speed: 8 + Math.random() * 12,
      opacity: 0.15 + Math.random() * 0.35,
    }));

    // --- Aurora / Floating Stardust Particles ---
    interface StarParticle {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      alpha: number;
      alphaSpeed: number;
    }
    const starParticles: StarParticle[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1 + Math.random() * 2,
      speedY: -(0.2 + Math.random() * 0.4),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: 0.2 + Math.random() * 0.6,
      alphaSpeed: 0.008 + Math.random() * 0.012,
    }));

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      if (soundType === 'rain') {
        // Render delicate falling rain streaks
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';

        rainDrops.forEach((drop) => {
          if (!isPaused) {
            drop.y += drop.speed;
            drop.x -= drop.speed * 0.15; // subtle angle
            if (drop.y > height) {
              drop.y = -drop.length;
              drop.x = Math.random() * (width + 100);
            }
          }

          ctx.beginPath();
          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity})`;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * 0.15, drop.y + drop.length);
          ctx.stroke();
        });
      } else if (soundType === 'waves') {
        // Render soothing liquid wave curves
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          ctx.beginPath();
          ctx.moveTo(0, height);

          const waveFreq = 0.002 + i * 0.001;
          const waveAmp = 25 + i * 15;
          const waveSpeed = time * (0.6 + i * 0.3);
          const baseHeight = height * (0.65 + i * 0.1);

          for (let x = 0; x <= width; x += 15) {
            const y = baseHeight + Math.sin(x * waveFreq + waveSpeed) * waveAmp + Math.cos(x * 0.001 + waveSpeed * 0.5) * 15;
            ctx.lineTo(x, y);
          }

          ctx.lineTo(width, height);
          ctx.closePath();

          const alpha = 0.05 + i * 0.04;
          ctx.fillStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.fill();
        }
      } else if (soundType === 'white_noise') {
        // Render floating stardust particles & organic aurora glow
        starParticles.forEach((p) => {
          if (!isPaused) {
            p.y += p.speedY;
            p.x += p.speedX;
            p.alpha += p.alphaSpeed;

            if (p.alpha > 0.8 || p.alpha < 0.2) {
              p.alphaSpeed = -p.alphaSpeed;
            }

            if (p.y < 0) {
              p.y = height;
              p.x = Math.random() * width;
            }
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 243, 208, ${p.alpha * 0.8})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(52, 211, 153, 0.5)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [soundType, isPaused]);

  // CSS Ambient Backdrop Gradients per theme
  const getBackdropClass = () => {
    switch (soundType) {
      case 'rain':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a1526] to-[#020617]';
      case 'waves':
        return 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-950 via-[#031e2b] to-[#020617]';
      case 'white_noise':
        return 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950 via-[#062419] to-[#020617]';
      default:
        return 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/60 via-[#080d1a] to-[#020617]';
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-700 ${getBackdropClass()} ${className}`}>
      {/* Dynamic Animated Ambient Light Blobs */}
      {soundType === 'rain' && (
        <div className="absolute top-10 left-1/4 w-[500px] h-[350px] bg-sky-600/10 rounded-full blur-[120px] animate-pulse" />
      )}
      {soundType === 'waves' && (
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[400px] bg-cyan-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '6.25s' }} />
      )}
      {soundType === 'white_noise' && (
        <>
          <div className="absolute -top-20 -right-20 w-[500px] h-[400px] bg-emerald-500/15 rounded-full blur-[130px] animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-[500px] h-[400px] bg-teal-600/10 rounded-full blur-[130px] animate-pulse" />
        </>
      )}
      {soundType === 'none' && (
        <>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        </>
      )}

      {/* GPU Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
