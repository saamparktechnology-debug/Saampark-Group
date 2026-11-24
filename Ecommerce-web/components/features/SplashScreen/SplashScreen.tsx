'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './SplashScreen.module.css';

interface Props {
  onComplete: () => void;
}

const SHARDS = [
  { row: 0, col: 0, tx: -58, ty: -54, rot: -26, delay: 0 },
  { row: 0, col: 1, tx: 4, ty: -68, rot: 14, delay: 65 },
  { row: 0, col: 2, tx: 60, ty: -50, rot: 28, delay: 130 },
  { row: 1, col: 0, tx: -68, ty: 8, rot: -18, delay: 95 },
  { row: 1, col: 1, tx: 0, ty: -14, rot: 8, delay: 40 },
  { row: 1, col: 2, tx: 68, ty: 10, rot: 22, delay: 160 },
  { row: 2, col: 0, tx: -52, ty: 58, rot: -30, delay: 115 },
  { row: 2, col: 1, tx: -6, ty: 70, rot: -14, delay: 185 },
  { row: 2, col: 2, tx: 56, ty: 54, rot: 25, delay: 145 },
];

export function SplashScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'broken' | 'waving' | 'glowing'>('broken');
  const [isFading, setIsFading] = useState(false);

  // Ambient 3D particle network canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const NODE_COUNT = 42;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#060B13';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.5);
      glowGrad.addColorStop(0, 'rgba(37, 99, 235, 0.24)');
      glowGrad.addColorStop(0.45, 'rgba(6, 182, 212, 0.10)');
      glowGrad.addColorStop(1, 'rgba(6, 11, 19, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.fillStyle = `rgba(96, 165, 250, ${n.alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Multi-stage animation choreography: Broken -> Waving & Attaching -> Glowing -> Home
  useEffect(() => {
    const waveTimer = setTimeout(() => setPhase('waving'), 420);
    const glowTimer = setTimeout(() => setPhase('glowing'), 1700);

    let current = 0;
    const duration = 2600;
    const interval = 25;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(timer);

        setTimeout(() => setIsFading(true), 450);
        setTimeout(() => onComplete(), 950);
      } else {
        setProgress(Math.floor(current));
      }
    }, interval);

    return () => {
      clearTimeout(waveTimer);
      clearTimeout(glowTimer);
      clearInterval(timer);
    };
  }, [onComplete]);

  return (
    <div className={`${styles.splashContainer} ${isFading ? styles.fadeOut : ''}`}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={`${styles.centerCard} ${phase === 'glowing' ? styles.cardGlow : ''}`}>
        {/* 3D Progress Halo + Broken->Waving->Glowing Logo Stage */}
        <div className={styles.ringWrapper}>
          <svg className={styles.svgRing} viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="74" className={styles.ringTrack} />
            <circle
              cx="80"
              cy="80"
              r="74"
              className={styles.ringProgress}
              style={{
                strokeDashoffset: 465 - (465 * progress) / 100,
              }}
            />
          </svg>

          {phase === 'glowing' && <div className={styles.shockwaveRing} />}

          {/* 3x3 Broken-to-Unified Logo Matrix */}
          <div
            className={`${styles.logoMatrix} ${
              phase === 'broken'
                ? styles.phaseBroken
                : phase === 'waving'
                ? styles.phaseWaving
                : styles.phaseGlowing
            }`}
          >
            {SHARDS.map((shard, idx) => (
              <div
                key={idx}
                className={styles.shardTile}
                style={
                  {
                    '--tx': `${shard.tx}px`,
                    '--ty': `${shard.ty}px`,
                    '--rot': `${shard.rot}deg`,
                    '--delay': `${shard.delay}ms`,
                  } as React.CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logos/logo-main-v2.png"
                  alt=""
                  className={styles.shardImg}
                  style={{
                    left: `${-shard.col * 100}%`,
                    top: `${-shard.row * 100}%`,
                  }}
                />
              </div>
            ))}

            {/* Unified seamless overlay after attachment for crisp final glow */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/logo-main-v2.png"
              alt="Saampark Group"
              className={`${styles.unifiedLogo} ${phase === 'glowing' ? styles.unifiedVisible : ''}`}
            />
          </div>
        </div>

        {/* Brand Titles */}
        <div className={styles.brandBox}>
          <h1 className={styles.brandTitle}>SAAMPARK GROUP</h1>
          <p className={styles.brandSubtitle}>Aspire For Optimum Excellence</p>
        </div>

        {/* Loading Progress Bar & Percentage */}
        <div className={styles.progressBox}>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.metaRow}>
            <span className={styles.isoBadge}>ISO 9001:2015</span>
            <span className={styles.percentText}>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
