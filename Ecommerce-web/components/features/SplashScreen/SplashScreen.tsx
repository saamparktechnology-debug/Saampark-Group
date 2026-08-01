'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './SplashScreen.module.css';

interface Props {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // ── 1. Interactive Ambient Canvas Setup ────────────────────────
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

    // Floating Particles Node Network
    const NODE_COUNT = 45;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep obsidian navy background
      ctx.fillStyle = '#060B13';
      ctx.fillRect(0, 0, width, height);

      // Render ambient radial glow at center
      const cx = width / 2;
      const cy = height / 2;
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(width, height) * 0.45);
      glowGrad.addColorStop(0, 'rgba(0, 180, 166, 0.18)');
      glowGrad.addColorStop(0.5, 'rgba(0, 212, 200, 0.05)');
      glowGrad.addColorStop(1, 'rgba(6, 11, 19, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        ctx.fillStyle = `rgba(0, 212, 200, ${n.alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(n.x - n2.x, n.y - n2.y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(0, 180, 166, ${0.15 * (1 - dist / 120)})`;
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

  useEffect(() => {
    // ── 2. Progress Controller (0% -> 100%) ────────────────────────
    let current = 0;
    const duration = 2000; // 2 seconds total loading animation
    const interval = 20; // 20ms update rate
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(timer);

        // Start fade out sequence
        setTimeout(() => setIsFading(true), 300);
        setTimeout(() => onComplete(), 800);
      } else {
        setProgress(Math.floor(current));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className={`${styles.splashContainer} ${isFading ? styles.fadeOut : ''}`}>
      <canvas ref={canvasRef} className={styles.canvas} />

      <div className={styles.centerCard}>
        {/* Glowing Aura Ring */}
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

          {/* Main Logo Image */}
          <div className={styles.logoContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logos/logo-main.png"
              alt="Saampark Group"
              className={styles.logoImage}
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
            <span className={styles.isoBadge}>🏆 ISO 9001:2015</span>
            <span className={styles.percentText}>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
