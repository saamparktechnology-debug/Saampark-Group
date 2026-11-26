'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Tag, Copy, Check } from 'lucide-react';
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
  ctaText?: string;
  image: string;
  accent: string;
  glowColor: string;
  promoCode?: string;
  promoPercent?: number;
}

function offerToSlide(off: StorefrontOffer): Slide {
  const hasPromo = Boolean(off.code && off.percent > 0);
  return {
    title: hasPromo
      ? `${off.scope === 'tech' ? 'Technology Offer' : 'Consultancy Offer'} • Code ${off.code}`
      : off.scope === 'tech'
        ? 'Saampark Technology'
        : 'Saampark Consultancy',
    highlight: off.title,
    subtitle: off.description,
    badge: off.badge || (hasPromo ? `${off.percent}% OFF Voucher` : 'Featured Offer'),
    badgeIcon: hasPromo ? Tag : Sparkles,
    href: off.ctaLink && off.ctaLink.startsWith('/') ? off.ctaLink : '/#marketplace-catalog',
    ctaText: off.ctaText || 'Claim Offer',
    image: off.image || '/assets/images/one-page-web.jpg',
    accent: off.scope === 'tech' ? '#2563EB' : '#EB412C',
    glowColor: off.scope === 'tech' ? 'rgba(37, 99, 235, 0.35)' : 'rgba(235, 65, 44, 0.35)',
    promoCode: hasPromo ? off.code : undefined,
    promoPercent: hasPromo ? off.percent : undefined,
  };
}

const SLIDES: Slide[] = [
  ...DEFAULT_TECH_OFFERS,
  ...DEFAULT_CONSULTANCY_OFFERS,
].map(offerToSlide);

export function PromoCarousel() {
  const [slides, setSlides] = useState<Slide[]>(SLIDES);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2500);
  };

  // Hydrate homepage offer banners strictly from CRM2 Storefront CMS discountBanners
  useEffect(() => {
    fetch('/api/storefront', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data?.storefront) return;
        const sf = json.data.storefront;
        const offers = extractStorefrontOffers(sf);
        if (offers.length > 0) {
          const mapped = offers.map(offerToSlide);
          setSlides(mapped);
          setCurrent((prev) => (prev >= mapped.length ? 0 : prev));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
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
                <Image
                  src={slide.image}
                  alt={slide.title}
                  width={960}
                  height={360}
                  className={styles.slideBgImg}
                  priority
                  unoptimized
                />
                <div className={styles.slideBgScrim} />

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
                      <span>{slide.ctaText || 'Claim Offer'}</span>
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
                            ? 'Copied'
                            : `Code: ${slide.promoCode}`}
                        </span>
                      </button>
                    )}
                  </div>
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
