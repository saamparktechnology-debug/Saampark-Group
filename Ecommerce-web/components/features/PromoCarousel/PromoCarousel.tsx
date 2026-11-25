'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Rocket, Megaphone, ShieldAlert, Smartphone, Tag, Copy, Check } from 'lucide-react';
import {
  extractStorefrontOffers,
  DEFAULT_TECH_OFFERS,
  DEFAULT_CONSULTANCY_OFFERS,
  type StorefrontOffer,
} from '@/lib/utils/offers';
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
  promoCode?: string;
  promoPercent?: number;
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
  const [slides, setSlides] = useState<Slide[]>(SLIDES);
  const [activeOffers, setActiveOffers] = useState<StorefrontOffer[]>([
    ...DEFAULT_TECH_OFFERS,
    ...DEFAULT_CONSULTANCY_OFFERS,
  ]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2500);
  };

  // Hydrate slides & live offer promo codes dynamically from CRM2 Storefront CMS
  useEffect(() => {
    fetch('/api/storefront', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data?.storefront) return;
        const sf = json.data.storefront;
        const offers = extractStorefrontOffers(sf);
        setActiveOffers(offers);

        const offerSlides: Slide[] = offers.map((off, idx) => ({
          title: `${off.title} • Use Code ${off.code}`,
          highlight: `FLAT ${off.percent}% OFF — Promo Code: ${off.code}`,
          subtitle: off.description,
          badge: `${off.percent}% OFF Voucher`,
          badgeIcon: Tag,
          href: off.ctaLink || '/#marketplace-catalog',
          image: off.image || '/assets/images/one-page-web.jpg',
          accent: off.scope === 'tech' ? '#2563EB' : '#EB412C',
          glowColor: off.scope === 'tech' ? 'rgba(37, 99, 235, 0.35)' : 'rgba(235, 65, 44, 0.35)',
          promoCode: off.code,
          promoPercent: off.percent,
        }));

        const techSlides = sf?.tech?.heroSlides || [];
        const consultSlides = sf?.consultancy?.heroSlides || [];
        const crmSlides = [...techSlides, ...consultSlides].filter((s: any) => s && s.isActive !== false);
        const mappedHero: Slide[] = crmSlides.map((s: any, idx: number) => ({
          title: s.badge || 'Saampark Official Offer',
          highlight: s.title || 'Digital Solutions',
          subtitle: s.subtitle || '',
          badge: s.badge || 'Featured',
          badgeIcon: idx % 2 === 0 ? Rocket : Sparkles,
          href: s.ctaLink && s.ctaLink.startsWith('/') ? s.ctaLink : '/#marketplace-catalog',
          image: s.image || '/assets/images/one-page-web.jpg',
          accent: idx % 2 === 0 ? '#2563EB' : '#EB412C',
          glowColor: idx % 2 === 0 ? 'rgba(37, 99, 235, 0.35)' : 'rgba(235, 65, 44, 0.35)',
        }));

        const merged = [...offerSlides, ...mappedHero, ...SLIDES].slice(0, 8);
        if (merged.length > 0) {
          setSlides(merged);
        }
      })
      .catch(() => {});
  }, []);

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
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setCurrent(prev => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
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
        {slides.map((slide, idx) => {
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
                    {slide.promoCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(slide.promoCode!)}
                        className={styles.promoCopyPill}
                        title="Click to copy promo code"
                      >
                        {copiedCode === slide.promoCode ? <Check size={12} /> : <Copy size={12} />}
                        <span>
                          {copiedCode === slide.promoCode
                            ? `Copied`
                            : `${slide.promoCode}`}
                        </span>
                      </button>
                    )}
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
        {slides.map((slide, idx) => (
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
