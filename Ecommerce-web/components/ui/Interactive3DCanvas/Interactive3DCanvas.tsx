'use client';

import React, { useEffect, useRef } from 'react';
import styles from './Interactive3DCanvas.module.css';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  color: string;
}

export function Interactive3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // Mouse coordinates in 3D
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = (currentScrollY - lastScrollY) * 0.4;
      lastScrollY = currentScrollY;
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Detect theme
    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

    // Particle Palette
    const lightColors = [
      'rgba(235, 65, 44, 0.45)', // Tomato Red
      'rgba(156, 175, 136, 0.55)', // Sage
      'rgba(37, 99, 235, 0.40)', // STR Blue
      'rgba(245, 166, 35, 0.40)', // Amber
    ];

    const darkColors = [
      'rgba(255, 201, 60, 0.65)', // Yellow
      'rgba(217, 218, 220, 0.50)', // Silver
      'rgba(56, 189, 248, 0.50)', // Sky Blue
      'rgba(52, 211, 153, 0.50)', // Emerald
    ];

    // Create 3D particle field
    const particleCount = Math.min(Math.floor((width * height) / 12000), 85);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.4,
        y: (Math.random() - 0.5) * height * 1.4,
        z: Math.random() * 800 + 100,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        vz: (Math.random() - 0.5) * 0.5,
        baseRadius: Math.random() * 2 + 1.2,
        color: lightColors[Math.floor(Math.random() * lightColors.length)],
      });
    }

    const fov = 400; // Field of view projection

    // Render loop
    const render = () => {
      // Smooth mouse damping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      scrollVelocity *= 0.92; // decay scroll velocity

      ctx.clearRect(0, 0, width, height);

      const dark = isDark();
      const currentColors = dark ? darkColors : lightColors;
      const mouseOffsetX = (mouseX - width / 2) * 0.3;
      const mouseOffsetY = (mouseY - height / 2) * 0.3;

      // Update and project particles
      const projected: { x: number; y: number; r: number; alpha: number; p: Particle }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particle with 3D inertia & scroll physics
        p.x += p.vx;
        p.y += p.vy - scrollVelocity;
        p.z += p.vz;

        // Wrap boundaries
        if (p.x < -width) p.x = width;
        if (p.x > width) p.x = -width;
        if (p.y < -height) p.y = height;
        if (p.y > height) p.y = -height;
        if (p.z < 50) p.z = 900;
        if (p.z > 950) p.z = 60;

        // 3D perspective projection
        const scale = fov / (fov + p.z);
        const projX = (p.x - mouseOffsetX) * scale + width / 2;
        const projY = (p.y - mouseOffsetY) * scale + height / 2;
        const radius = p.baseRadius * scale * (1 + Math.abs(scrollVelocity) * 0.05);
        const alpha = Math.min(1, Math.max(0.1, (1 - p.z / 950) * (dark ? 0.9 : 0.75)));

        projected.push({ x: projX, y: projY, r: radius, alpha, p });
      }

      // Draw constellation links
      const maxDistance = dark ? 110 : 95;
      ctx.lineWidth = dark ? 0.8 : 0.6;

      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        for (let j = i + 1; j < projected.length; j++) {
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.25 * Math.min(p1.alpha, p2.alpha);
            ctx.strokeStyle = dark
              ? `rgba(255, 201, 60, ${lineAlpha})`
              : `rgba(235, 65, 44, ${lineAlpha * 0.75})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      for (let i = 0; i < projected.length; i++) {
        const item = projected[i];
        const color = currentColors[i % currentColors.length];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, Math.max(0.5, item.r), 0, Math.PI * 2);
        ctx.fill();

        // Glowing halos for nearest particles
        if (item.alpha > 0.6) {
          ctx.fillStyle = dark
            ? `rgba(255, 201, 60, ${item.alpha * 0.15})`
            : `rgba(235, 65, 44, ${item.alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
