'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Users, Grid3X3, Award } from 'lucide-react';
import { STATS } from '@/lib/data/services';
import styles from './LiveStats.module.css';

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, active]);
  return value;
}

const ICONS = { CheckCircle, Users, Grid3X3, Award };

function StatCard({ value, suffix, label, icon, active }: {
  value: number; suffix: string; label: string; icon: string; active: boolean;
}) {
  const count = useCountUp(value, 2000, active);
  const Icon  = ICONS[icon as keyof typeof ICONS] ?? CheckCircle;
  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrap}>
        <Icon size={24} />
      </div>
      <div className={styles.statValue}>
        {count}{suffix}
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statPulse} />
    </div>
  );
}

export function LiveStats() {
  const ref    = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.section}>
      {/* Background */}
      <div className={styles.bg} />

      <div className="container">
        <div className={styles.header}>
          <div className="section-label" style={{ color: 'var(--primitive-teal-400)' }}>
            ✦ Live Numbers
          </div>
          <h2 className={`text-display-lg ${styles.title}`}>
            Trusted by Businesses Across India
          </h2>
        </div>

        <div className={styles.grid}>
          {STATS.map(s => (
            <StatCard key={s.label} {...s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
