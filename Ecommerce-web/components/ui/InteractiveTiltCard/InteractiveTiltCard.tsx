'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './InteractiveTiltCard.module.css';

interface InteractiveTiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
}

export function InteractiveTiltCard({
  children,
  className = '',
  maxTilt = 8,
  glowColor = 'rgba(235, 65, 44, 0.45)',
}: InteractiveTiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState<string>('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // 3D Scroll Reveal: Intersection Observer detects viewport entrance
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '40px 0px -40px 0px',
      }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = x / rect.width;
      const normY = y / rect.height;

      const rotX = (normY - 0.5) * -maxTilt * 2;
      const rotY = (normX - 0.5) * maxTilt * 2;

      setTransform(
        `perspective(1100px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`
      );

      // Set CSS variables for Aceternity-style mouse-following border glow
      cardRef.current.style.setProperty('--mouse-x', `${(normX * 100).toFixed(1)}%`);
      cardRef.current.style.setProperty('--mouse-y', `${(normY * 100).toFixed(1)}%`);

      setGlarePos({
        x: normX * 100,
        y: normY * 100,
        opacity: 0.7,
      });
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.tiltWrapper} ${isVisible ? styles.visibleInScroll : styles.hiddenBeforeScroll} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        '--card-glow-color': glowColor,
      } as React.CSSProperties}
    >
      {/* 3D Glowing Laser Border that tracks cursor */}
      <div className={styles.spotlightBorder} aria-hidden="true" />

      {/* Actual Card Body with 3D Z-Depth Preservation */}
      <div className={styles.tiltInnerLayer}>
        {children}
      </div>

      {/* Dynamic Specular Spotlight Glare */}
      <div
        className={styles.specularGlare}
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 68%)`,
          opacity: glarePos.opacity,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
