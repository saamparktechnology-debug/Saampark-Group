'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CategoryCoverflow.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'web-development',
    title: '🌐 Web Development',
    description: 'Dynamic & E-Commerce sites built for scale.',
    image: '/assets/images/services/str-web-dynamic.png',
    gradient: 'linear-gradient(135deg, rgba(30, 144, 255, 0.1) 0%, rgba(244, 81, 30, 0.1) 100%)',
  },
  {
    id: 'app-development',
    title: '📱 Mobile Applications',
    description: 'High-performance Android & iOS Hybrid Apps.',
    image: '/assets/images/services/str-app-android.png',
    gradient: 'linear-gradient(135deg, rgba(61, 220, 132, 0.1) 0%, rgba(84, 197, 248, 0.1) 100%)',
  },
  {
    id: 'ai-integration',
    title: '🤖 AI & Automation',
    description: 'Custom ChatGPT Chatbots & Workflow Automation.',
    image: '/assets/images/services/str-ai-chatbot.png',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
  },
  {
    id: 'financial-research',
    title: '📈 Financial Research',
    description: 'Algorithmic trading & fundamental equity analysis.',
    image: '/assets/images/services/res-stock-equity.png',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
  },
  {
    id: 'digital-marketing',
    title: '📢 Digital Marketing',
    description: 'Complete Social Media & Meta Ads Management.',
    image: '/assets/images/services/scs-social-standard.png',
    gradient: 'linear-gradient(135deg, rgba(24, 119, 242, 0.1) 0%, rgba(8, 102, 255, 0.1) 100%)',
  },
  {
    id: 'business-legal',
    title: '⚖️ Business & Legal Setup',
    description: 'Pvt. Ltd. Registration, GST, and MSME filings.',
    image: '/assets/images/services/con-pvt-ltd.png',
    gradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.1) 0%, rgba(100, 116, 139, 0.1) 100%)',
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
    }, 4000); // 4 seconds interval for a slow, smooth pace
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
      <h2 className={styles.title}>Explore Our Core</h2>
      
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

            const zIndex = 100 - absOffset;
            
            // Adjust scale to make center larger and sides smaller
            const scale = isActive ? 1.1 : 1 - absOffset * 0.15;
            
            const translateX = offset * (isMobile ? 85 : 110);
            const rotateY = isActive ? 0 : offset > 0 ? -40 : 40;
            const opacity = isActive ? 1 : absOffset === 1 ? 0.5 : absOffset === 2 ? 0.15 : 0;

            return (
              <div 
                key={cat.id} 
                className={`${styles.card} ${isActive ? styles.active : ''}`}
                style={{ 
                  transform: `translateX(${translateX}%) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                  zIndex,
                  opacity,
                  visibility: opacity === 0 ? 'hidden' : 'visible'
                }}
                onClick={(e) => handleCardClick(index, cat.id, e)}
              >
                <div className={styles.cardInner} style={{ background: cat.gradient }}>
                  <div className={styles.imageWrap}>
                    <Image 
                      src={cat.image} 
                      alt={cat.title} 
                      fill 
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 768px) 300px, 400px"
                    />
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{cat.title}</h3>
                    <p>{cat.description}</p>
                    {isActive && (
                      <button 
                        className={styles.exploreBtn}
                        onClick={(e) => handleExploreClick(cat.id, e)}
                      >
                        Explore
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
