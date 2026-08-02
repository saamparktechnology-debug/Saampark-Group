'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './CategoryBar.module.css';

const CATEGORIES = [
  { value: 'all', label: 'All Services', emoji: '🛍️' },
  { value: 'website', label: 'Websites', emoji: '🌐' },
  { value: 'app', label: 'Mobile Apps', emoji: '📱' },
  { value: 'software', label: 'Software / ERP', emoji: '⚙️' },
  { value: 'specialized-website', label: 'Specialized Web', emoji: '🚀' },
  { value: 'social-media', label: 'Social Media', emoji: '📣' },
  { value: 'meta-ads', label: 'Meta Ads', emoji: '📢' },
  { value: 'google-ads', label: 'Google Ads', emoji: '🔍' },
  { value: 'google-business', label: 'Google Business', emoji: '📍' },
  { value: 'video-ai', label: 'Video & AI', emoji: '🤖' },
  { value: 'business-legal', label: 'Business & Legal', emoji: '💼' },
];

export function CategoryBar() {
  return (
    <Suspense fallback={<div style={{ height: '56px' }} />}>
      <CategoryBarContent />
    </Suspense>
  );
}

function CategoryBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const cat = searchParams.get('category');
    setActiveCategory(cat || 'all');
  }, [searchParams]);

  const handleCategoryClick = (cat: string) => {
    if (cat === 'all') {
      router.push('/');
    } else {
      router.push(`/?category=${cat}`);
    }
  };

  return (
    <div className={styles.categoryBar}>
      <div className={styles.scrollContainer}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`${styles.itemBtn} ${activeCategory === cat.value ? styles.active : ''}`}
            onClick={() => handleCategoryClick(cat.value)}
          >
            <span className={styles.emoji}>{cat.emoji}</span>
            <span className={styles.label}>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
