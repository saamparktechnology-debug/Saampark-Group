'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CategoryCoverflow.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CoreSlideItem {
  id: string;
  title: string;
  tag: string;
  description: string;
  image: string;
  accent: string;
  glowColor: string;
  targetSectionId?: string;
}

const DEFAULT_TECH_CATEGORIES: CoreSlideItem[] = [
  {
    id: 'web-services',
    title: 'Web Development',
    tag: 'Next.js & E-Commerce',
    description: 'Dynamic & high-converting storefronts built for scale.',
    image: '/assets/images/services/str-web-dynamic.png',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.4)',
    targetSectionId: 'web-services',
  },
  {
    id: 'application-services',
    title: 'Mobile Applications',
    tag: 'iOS & Android Hybrid',
    description: 'Flutter & React Native ultra-fast mobile applications.',
    image: '/assets/images/services/str-app-android.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
    targetSectionId: 'application-services',
  },
  {
    id: 'ai-services',
    title: 'AI & Automation',
    tag: 'ChatGPT & Agents',
    description: 'Custom AI Chatbots, agentic automation & ERP intelligence.',
    image: '/assets/images/services/str-ai-chatbot.png',
    accent: '#FFC93C',
    glowColor: 'rgba(255, 201, 60, 0.4)',
    targetSectionId: 'ai-services',
  },
  {
    id: 'software-services',
    title: 'Software & ERP Systems',
    tag: 'Cloud ERP & Portals',
    description: 'Tailored enterprise software, CRM, and billing systems.',
    image: '/assets/images/services/res-stock-equity.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
    targetSectionId: 'software-services',
  },
];

const DEFAULT_CONSULTANCY_CATEGORIES: CoreSlideItem[] = [
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    tag: 'Meta & Google Ads',
    description: 'High-ROI multi-channel campaigns & verified business leads.',
    image: '/assets/images/services/scs-social-standard.png',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.4)',
    targetSectionId: 'digital-marketing',
  },
  {
    id: 'legal',
    title: 'Business & Legal Setup',
    tag: 'Pvt Ltd & GST Filings',
    description: 'ISO-certified legal company formation & tax compliance.',
    image: '/assets/images/services/con-pvt-ltd.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
    targetSectionId: 'legal',
  },
];

const INITIAL_CATEGORIES: CoreSlideItem[] = [
  ...DEFAULT_TECH_CATEGORIES,
  ...DEFAULT_CONSULTANCY_CATEGORIES,
];

export function CategoryCoverflow() {
  const [categories, setCategories] = useState<CoreSlideItem[]>(INITIAL_CATEGORIES);
  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);

  // Sync Core Capability sliders managed via CRM2 Storefront CMS
  useEffect(() => {
    fetch('/api/storefront', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data?.storefront) return;
        const sf = json.data.storefront;
        const techRaw = Array.isArray(sf?.tech?.coreSliders)
          ? sf.tech.coreSliders
          : DEFAULT_TECH_CATEGORIES;
        const consultRaw = Array.isArray(sf?.consultancy?.coreSliders)
          ? sf.consultancy.coreSliders
          : DEFAULT_CONSULTANCY_CATEGORIES;

        const combined = [...techRaw, ...consultRaw]
          .filter((s: any) => s && s.isActive !== false && s.title)
          .sort((a: any, b: any) => (Number(a.order) || 99) - (Number(b.order) || 99))
          .map((s: any): CoreSlideItem => {
            const accentHex = s.accent || '#EB412C';
            return {
              id: String(s.id || s.title),
              title: String(s.title),
              tag: String(s.tag || 'CORE'),
              description: String(s.description || ''),
              image: String(s.image || '/assets/images/services/str-web-dynamic.png'),
              accent: accentHex,
              glowColor: accentHex === '#FFC93C'
                ? 'rgba(255, 201, 60, 0.4)'
                : accentHex === '#9CAF88'
                ? 'rgba(156, 175, 136, 0.4)'
                : 'rgba(235, 65, 44, 0.4)',
              targetSectionId: s.targetSectionId || s.id,
            };
          });

        if (combined.length > 0) {
          setCategories(combined);
          setActiveIndex((prev) => Math.min(prev, combined.length - 1));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (categories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categories.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [categories.length]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % categories.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const scrollToTarget = (targetId?: string) => {
    const section =
      (targetId ? document.getElementById(targetId) : null) ||
      document.getElementById('marketplace-catalog');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCardClick = (index: number, targetId: string | undefined, e: React.MouseEvent) => {
    e.preventDefault();
    if (index !== activeIndex) {
      setActiveIndex(index);
    } else {
      scrollToTarget(targetId);
    }
  };

  const handleExploreClick = (targetId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToTarget(targetId);
  };

  return (
    <div className={styles.coverflowContainer}>
      <div className={styles.headerArea}>
        <h2 className={styles.title}>Explore Our Core</h2>
        <p className={styles.subtitle}>Select any domain to explore ISO 9001:2015 verified solutions</p>
      </div>
      
      <div className={styles.carouselWrapper}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="Previous">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.slider}>
          {categories.map((cat, index) => {
            const total = categories.length;
            let offset = index - activeIndex;
            
            // Wrap around cleanly for dynamic slider count
            const half = Math.floor(total / 2);
            if (offset < -half) offset += total;
            if (offset > total - half - 1) offset -= total;

            const absOffset = Math.abs(offset);
            const isActive = offset === 0;

            const zIndex = 100 - absOffset * 10;
            
            // Compact refined 3D scale and depth with low background bleed
            const scale = isActive ? 1.08 : Math.max(0.76, 1 - absOffset * 0.14);
            
            const translateX = offset * (isMobile ? 55 : 105);
            const rotateY = isActive ? 0 : offset > 0 ? -45 : 45;
            const translateZ = isActive ? 100 : -absOffset * 70;
            const opacity = isActive ? 1 : absOffset === 1 ? 0.55 : absOffset === 2 ? 0.22 : 0;

            return (
              <div 
                key={cat.id} 
                className={`${styles.card} ${isActive ? styles.active : ''}`}
                style={{ 
                  transform: `translate3d(${translateX}%, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`,
                  zIndex,
                  opacity,
                  visibility: opacity === 0 ? 'hidden' : 'visible',
                  '--cat-accent': cat.accent,
                  '--cat-glow': cat.glowColor,
                } as React.CSSProperties}
                onClick={(e) => handleCardClick(index, cat.targetSectionId || cat.id, e)}
              >
                <div 
                  className={`${styles.groundShadow} ${isActive ? styles.activeGroundShadow : ''}`} 
                />
                
                <div className={styles.cardInner}>
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    width={360}
                    height={420}
                    className={styles.cardBgImage}
                    unoptimized
                    priority
                  />
                  <div className={styles.cardBgScrim} />
                  <div className={styles.topGlassSheen} />

                  {/* Directional Shading Overlay on side cards */}
                  {!isActive && (
                    <div
                      className={styles.directionalShade}
                      style={{ opacity: Math.min(0.6, absOffset * 0.3) }}
                    />
                  )}

                  <div className={styles.cardContent}>
                    <span className={styles.cardTag}>
                      {cat.tag}
                    </span>
                    <h3>{cat.title}</h3>
                    <p>{cat.description}</p>
                    {isActive && (
                      <button
                        className={styles.exploreBtn}
                        onClick={(e) => handleExploreClick(cat.targetSectionId || cat.id, e)}
                      >
                        Explore Services <span className={styles.exploreArrow}>→</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className={styles.navBtn} onClick={handleNext} aria-label="Next">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className={styles.pagination}>
        {categories.map((_, idx) => (
          <span 
            key={idx} 
            className={`${styles.dot} ${idx === activeIndex ? styles.activeDot : ''}`}
            onClick={() => setActiveIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
}
