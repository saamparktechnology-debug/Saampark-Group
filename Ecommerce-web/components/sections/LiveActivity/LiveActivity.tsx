'use client';

import React from 'react';
import { LIVE_ACTIVITIES } from '@/lib/data/services';
import styles from './LiveActivity.module.css';

export function LiveActivity() {
  const items = [...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES];

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.indicator}>
            <span className={styles.dot} />
            LIVE
          </div>
          <span className={styles.label}>Real-Time Business Activity</span>
        </div>
      </div>

      <div className={styles.ribbonWrap}>
        <div className={styles.fadeLeft}  />
        <div className={styles.fadeRight} />
        <div className={styles.track}>
          {items.map((item, i) => (
            <div key={i} className={styles.item}>
              <span className={styles.emoji}>{item.emoji}</span>
              <span className={styles.text}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
