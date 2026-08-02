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
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    title: 'Web Engineering Special',
    highlight: 'One Page Website at ₹1,499! (Save 25%)',
    subtitle: 'Fully responsive, modern portfolio layout with essential SEO.',
    badge: '⚡ Special Offer',
    badgeIcon: Rocket,
    href: '/technology/web-development/one-page-website',
    image: '/assets/images/one-page-web.jpg',
    gradient: 'linear-gradient(135deg, rgba(0, 180, 166, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%)',
  },
  {
    title: 'Local Ads Launch Deal',
    highlight: 'Meta & Google Ads Trial at ₹499/wk!',
    subtitle: 'Target 1M+ local customers & boost business leads fast.',
    badge: '🔥 Highly Popular',
    badgeIcon: Megaphone,
    href: '/consultancy/ads-management/meta-ads',
    image: '/assets/images/meta-ads-weekly.jpg',
    gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(245, 166, 35, 0.08) 100%)',
  },
  {
    title: 'Creative AI Production',
    highlight: 'Full AI Video Ad at ₹1,499!',
    subtitle: 'AI voiceover, professional script & fast 72h delivery.',
    badge: '🤖 AI Innovation',
    badgeIcon: Sparkles,
    href: '/consultancy/video-ai/full-ai-video',
    image: '/assets/images/video-full-ai.jpg',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
  },
  {
    title: 'Business Legal Special',
    highlight: 'Pvt Ltd Registration — Complete Legal',
    subtitle: 'DSC, DIN, MOA, AOA & MCA filing handled by experts.',
    badge: '💼 Professional Legal',
    badgeIcon: ShieldAlert,
    href: '/consultancy/business-legal/pvt-ltd-registration',
    image: '/assets/images/pvtltd-reg.jpg',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
  },
  {
    title: 'Mobile App Prototyping',
    highlight: 'Hybrid App (Android + iOS) Solution',
    subtitle: 'Flutter cross-platform single codebase development.',
    badge: '📱 Mobile App',
    badgeIcon: Smartphone,
    href: '/technology/app-development/hybrid',
    image: '/assets/images/hybrid-app.jpg',
    gradient: 'linear-gradient(135deg, rgba(30, 144, 255, 0.08) 0%, rgba(76, 175, 80, 0.08) 100%)',
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

  // On mobile: 100% per slide, on desktop: 75% per slide centered
  const transformStyle = isMobile
    ? `translateX(-${current * 100}%)`
    : `translateX(calc(12.5% - ${current * 75}%))`;

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
            <div 
              key={idx} 
              className={`${styles.slide} ${isActive ? styles.activeSlide : styles.inactiveSlide}`}
              style={{ background: slide.gradient }}
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
                  <Link href={slide.href} className={`btn btn-primary btn-sm ${styles.ctaBtn}`}>
                    Claim Offer →
                  </Link>
                </div>
              </div>

              <div className={styles.imageColumn}>
                <Image
                  src={slide.image}
                  alt={slide.title}
                  width={200}
                  height={130}
                  className={styles.slideImg}
                  priority
                  unoptimized
                />
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
        <ChevronLeft size={16} />
      </button>
      <button 
        className={`${styles.arrowBtn} ${styles.right}`} 
        onClick={handleNext}
        aria-label="Next Slide"
      >
        <ChevronRight size={16} />
      </button>

      <div className={styles.dots}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === current ? styles.activeDot : ''}`}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
