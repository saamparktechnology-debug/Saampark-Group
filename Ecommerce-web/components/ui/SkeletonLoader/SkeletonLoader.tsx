import React from 'react';
import styles from './SkeletonLoader.module.css';

interface Props {
  count?: number;
}

export function SkeletonLoader({ count = 5 }: Props) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={styles.card}>
          <div className={`${styles.shimmer} ${styles.image}`} />
          <div className={styles.body}>
            <div className={`${styles.shimmer} ${styles.rating}`} />
            <div className={`${styles.shimmer} ${styles.title}`} />
            <div className={`${styles.shimmer} ${styles.desc}`} />
            <div className={`${styles.shimmer} ${styles.price}`} />
          </div>
          <div className={styles.actions}>
            <div className={`${styles.shimmer} ${styles.btn}`} />
            <div className={`${styles.shimmer} ${styles.icon}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
