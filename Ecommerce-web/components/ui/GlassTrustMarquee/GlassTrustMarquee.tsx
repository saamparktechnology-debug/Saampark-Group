'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Award, Zap, Code2, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import styles from './GlassTrustMarquee.module.css';

const TRUST_BADGES = [
  {
    icon: Award,
    title: 'ISO 9001:2015 CERTIFIED',
    subtitle: 'Government Recognised Quality Standards',
    accent: '#EB412C',
  },
  {
    icon: Code2,
    title: '100% CODE & IP OWNERSHIP',
    subtitle: 'Full Commercial Rights Delivered',
    accent: '#3B82F6',
  },
  {
    icon: Zap,
    title: 'RAPID 5-7 DAY SPRINTS',
    subtitle: 'Agile Delivery with Live Staging URL',
    accent: '#F5A623',
  },
  {
    icon: ShieldCheck,
    title: 'ENTERPRISE-GRADE SECURITY',
    subtitle: 'SSL, Cloudflare & OWASP Compliant',
    accent: '#10B981',
  },
  {
    icon: TrendingUp,
    title: '₹1.2CR+ CLIENT REVENUE GENERATED',
    subtitle: 'Proven Multi-Industry ROI',
    accent: '#EB412C',
  },
  {
    icon: Users,
    title: '1,248+ VERIFIED BUSINESS CLIENTS',
    subtitle: 'Rated 4.9/5 Across Google & Clutch',
    accent: '#9CAF88',
  },
  {
    icon: Sparkles,
    title: '39+ DEDICATED DIGITAL SERVICES',
    subtitle: 'Web, Mobile, Software & Legal Setup',
    accent: '#FFC93C',
  },
  {
    icon: CheckCircle2,
    title: 'TRANSPARENT FIXED PRICING',
    subtitle: 'Starting ₹499 with Zero Hidden Costs',
    accent: '#10B981',
  },
];

export function GlassTrustMarquee() {
  // Duplicate for smooth seamless infinite scroll loop
  const duplicatedBadges = [...TRUST_BADGES, ...TRUST_BADGES];

  return (
    <div className={styles.marqueeSection} aria-label="Trust and Certifications">
      <div className={styles.fadeLeft} />
      <div className={styles.fadeRight} />
      
      <div className={styles.track}>
        {duplicatedBadges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div key={idx} className={styles.pillItem}>
              <div
                className={styles.iconCircle}
                style={{
                  background: `linear-gradient(135deg, ${badge.accent}22 0%, ${badge.accent}08 100%)`,
                  borderColor: `${badge.accent}44`,
                  color: badge.accent,
                }}
              >
                <Icon size={16} />
              </div>
              <div className={styles.textGroup}>
                <span className={styles.pillTitle}>{badge.title}</span>
                <span className={styles.pillSubtitle}>{badge.subtitle}</span>
              </div>
              <div className={styles.ambientGlow} style={{ background: badge.accent }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
