'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Rocket, Megaphone, ShieldAlert, Smartphone } from 'lucide-react';
import styles from './PromoCarousel.module.css';

interface Slide {
  title: string;
  highlight: string;
  subtitle: string;
  badge: string;
  badgeIcon: React.ComponentType<{ size?: number }>;
  href: string;
  image: string;
  accent: string;
  glowColor: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Web Engineering Special',
    highlight: 'One Page Website at ₹1,499! (Save 25%)',
    subtitle: 'Fully responsive, modern portfolio layout with essential SEO & lightning performance.',
    badge: 'Special Offer',
    badgeIcon: Rocket,
    href: '/technology/web-development/one-page-website',
    image: '/assets/images/one-page-web.jpg',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.45)',
  },
  {
    title: 'Local Ads Launch Deal',
    highlight: 'Meta & Google Ads Trial at ₹499/wk!',
    subtitle: 'Target 1M+ local customers & boost verified business leads in 48 hours.',
    badge: 'Popular',
    badgeIcon: Megaphone,
    href: '/consultancy/ads-management/meta-ads',
    image: '/assets/images/meta-ads-weekly.jpg',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.45)',
  },
  {
    title: 'Creative AI Production',
    highlight: 'Full AI Video Ad at ₹1,499!',
    subtitle: 'Studio AI voiceover, cinematic script & guaranteed 72h turnaround delivery.',
    badge: 'AI Innovation',
    badgeIcon: Sparkles,
    href: '/consultancy/video-ai/full-ai-video',
    image: '/assets/images/video-full-ai.jpg',
    accent: '#FFC93C',
    glowColor: 'rgba(255, 201, 60, 0.45)',
  },
  {
    title: 'Business Legal Special',
    highlight: 'Pvt Ltd Registration — Complete Legal',
    subtitle: 'DSC, DIN, MOA, AOA & MCA filings handled directly by certified chartered experts.',
    badge: 'Professional Legal',
    badgeIcon: ShieldAlert,
    href: '/consultancy/business-legal/pvt-ltd-registration',
    image: '/assets/images/pvtltd-reg.jpg',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.45)',
  },
  {
    title: 'Mobile App Prototyping',
    highlight: 'Hybrid App (Android + iOS) Solution',
    subtitle: 'Flutter cross-platform single codebase development with native fluid 60FPS.',
    badge: 'Mobile Application',
    badgeIcon: Smartphone,
    href: '/technology/app-development/hybrid',
    image: '/assets/images/hybrid-app.jpg',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.45)',
  },
];

export function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = () => {
    setCurrent(prev => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  // 100% width per slide guarantees exact centering on all screen widths
  const transformStyle = `translateX(-${current * 100}%)`;

  return (
    <div 
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional Carousel"
    >
      <div 
        className={styles.slidesTrack}
        style={{ transform: transformStyle }}
      >
        {SLIDES.map((slide, idx) => {
          const BadgeIcon = slide.badgeIcon;
          const isActive = idx === current;
          return (
            <div key={idx} className={styles.slideWrapper}>
              <div 
                className={`${styles.slide} ${isActive ? styles.activeSlide : styles.inactiveSlide}`}
                style={{
                  '--slide-accent': slide.accent,
                  '--slide-glow': slide.glowColor,
                } as React.CSSProperties}
              >
                <div className={styles.slideContent}>
                  <div className={styles.topMeta}>
                    <div className={styles.badge}>
                      <BadgeIcon size={12} />
                      <span>{slide.badge}</span>
                    </div>
                    <span className={styles.title}>{slide.title}</span>
                  </div>

                  <h3 className={styles.highlight}>{slide.highlight}</h3>
                  <p className={styles.subtitle}>{slide.subtitle}</p>

                  <div className={styles.ctaRow}>
                    <Link 
                      href={slide.href} 
                      className={styles.ctaBtn}
                    >
                      <span>Claim Offer</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>

                <div className={styles.imageColumn}>
                  <div 
                    className={styles.imageBackdropGlow}
                    style={{ background: `radial-gradient(circle, ${slide.glowColor} 0%, transparent 70%)` }}
                  />
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    width={220}
                    height={140}
                    className={styles.slideImg}
                    priority
                    unoptimized
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className={`${styles.arrowBtn} ${styles.left}`} 
        onClick={handlePrev}
        aria-label="Previous Slide"
      >
        <ChevronLeft size={18} />
      </button>
      <button 
        className={`${styles.arrowBtn} ${styles.right}`} 
        onClick={handleNext}
        aria-label="Next Slide"
      >
        <ChevronRight size={18} />
      </button>

      <div className={styles.dots}>
        {SLIDES.map((slide, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === current ? styles.activeDot : ''}`}
            style={{
              background: idx === current ? slide.accent : undefined,
              boxShadow: idx === current ? `0 0 14px ${slide.glowColor}` : undefined
            }}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
