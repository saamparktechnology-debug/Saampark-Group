'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CategoryCoverflow.module.css';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'web-development',
    title: '🌐 Web Development',
    tag: 'Next.js & E-Commerce',
    description: 'Dynamic & high-converting storefronts built for scale.',
    image: '/assets/images/services/str-web-dynamic.png',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.4)',
  },
  {
    id: 'app-development',
    title: '📱 Mobile Applications',
    tag: 'iOS & Android Hybrid',
    description: 'Flutter & React Native ultra-fast mobile applications.',
    image: '/assets/images/services/str-app-android.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
  },
  {
    id: 'ai-integration',
    title: '🤖 AI & Automation',
    tag: 'ChatGPT & Agents',
    description: 'Custom AI Chatbots, agentic automation & ERP intelligence.',
    image: '/assets/images/services/str-ai-chatbot.png',
    accent: '#FFC93C',
    glowColor: 'rgba(255, 201, 60, 0.4)',
  },
  {
    id: 'software-services',
    title: '⚙️ Software & ERP Systems',
    tag: 'Cloud ERP & Portals',
    description: 'Tailored enterprise software, CRM, and billing systems.',
    image: '/assets/images/services/res-stock-equity.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
  },
  {
    id: 'digital-marketing',
    title: '📢 Digital Marketing',
    tag: 'Meta & Google Ads',
    description: 'High-ROI multi-channel campaigns & verified business leads.',
    image: '/assets/images/services/scs-social-standard.png',
    accent: '#EB412C',
    glowColor: 'rgba(235, 65, 44, 0.4)',
  },
  {
    id: 'business-legal',
    title: '⚖️ Business & Legal Setup',
    tag: 'Pvt Ltd & GST Filings',
    description: 'ISO-certified legal company formation & tax compliance.',
    image: '/assets/images/services/con-pvt-ltd.png',
    accent: '#9CAF88',
    glowColor: 'rgba(156, 175, 136, 0.4)',
  },
];

export function CategoryCoverflow() {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CATEGORIES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % CATEGORIES.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + CATEGORIES.length) % CATEGORIES.length);
  };

  const handleCardClick = (index: number, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (index !== activeIndex) {
      setActiveIndex(index);
    } else {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleExploreClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={styles.coverflowContainer}>
      <div className={styles.headerArea}>
        <span className={styles.eyebrowBadge}>
          <Sparkles size={12} /> ENTERPRISE CORE CAPABILITIES
        </span>
        <h2 className={styles.title}>Explore Our Core</h2>
        <p className={styles.subtitle}>Select any domain to explore ISO 9001:2015 verified solutions</p>
      </div>
      
      <div className={styles.carouselWrapper}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="Previous">
          <ChevronLeft size={24} />
        </button>

        <div className={styles.slider}>
          {CATEGORIES.map((cat, index) => {
            let offset = index - activeIndex;
            
            // Wrap around logic for infinite feel based on 6 items
            if (offset < -3) offset += 6;
            if (offset > 2) offset -= 6;

            const absOffset = Math.abs(offset);
            const isActive = offset === 0;

            const zIndex = 100 - absOffset * 10;
            
            // Compact refined 3D scale and physical depth
            const scale = isActive ? 1.08 : Math.max(0.76, 1 - absOffset * 0.14);
            
            const translateX = offset * (isMobile ? 55 : 105);
            const rotateY = isActive ? 0 : offset > 0 ? -45 : 45;
            const translateZ = isActive ? 100 : -absOffset * 70;
            const opacity = isActive ? 1 : absOffset === 1 ? 0.78 : absOffset === 2 ? 0.35 : 0;

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
                onClick={(e) => handleCardClick(index, cat.id, e)}
              >
                <div 
                  className={`${styles.groundShadow} ${isActive ? styles.activeGroundShadow : ''}`} 
                />
                
                <div className={styles.cardInner}>
                  <div className={styles.topGlassSheen} />
                  
                  {/* Directional Shading Overlay on side cards */}
                  {!isActive && (
                    <div 
                      className={styles.directionalShade} 
                      style={{ opacity: Math.min(0.6, absOffset * 0.3) }} 
                    />
                  )}

                  <div className={styles.imageWrap}>
                    <div 
                      className={styles.imageGlowBackdrop} 
                      style={{ background: `radial-gradient(circle, ${cat.glowColor} 0%, transparent 70%)` }}
                    />
                    <Image 
                      src={cat.image} 
                      alt={cat.title} 
                      width={120}
                      height={90}
                      className={styles.cardImage}
                      unoptimized
                      priority
                    />
                  </div>

                  <div className={styles.cardContent}>
                    <span className={styles.cardTag}>
                      {cat.tag}
                    </span>
                    <h3>{cat.title}</h3>
                    <p>{cat.description}</p>
                    {isActive && (
                      <button 
                        className={styles.exploreBtn}
                        onClick={(e) => handleExploreClick(cat.id, e)}
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
        {CATEGORIES.map((_, idx) => (
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
