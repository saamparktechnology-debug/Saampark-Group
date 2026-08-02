'use client';

import React from 'react';
import { PROMO_ITEMS } from '@/lib/data/services';
import Link from 'next/link';
import styles from './PromoRibbon.module.css';

export function PromoRibbon() {
  // Duplicate for seamless loop
  const items = [...PROMO_ITEMS, ...PROMO_ITEMS];

  return (
    <div className={styles.ribbon}>
      <div className={styles.inner}>
        <div className={styles.track}>
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={styles.item}
              style={{ '--accent': item.color } as React.CSSProperties}
            >
              <span className={styles.label}>{item.label}</span>
              <span className={styles.sep}>·</span>
              <span className={styles.value}>{item.value}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
