'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, Sparkles, ShieldCheck, Globe, Briefcase } from 'lucide-react';
import { SaamparkWorld } from '@/components/3d/SaamparkWorld/SaamparkWorld';
import styles from './CinematicHero.module.css';

interface CinematicHeroProps {
  onSelectDivision?: (division: 'technology' | 'consultancy' | 'all') => void;
}

export function CinematicHero({ onSelectDivision }: CinematicHeroProps) {
  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    const catalogEl = document.getElementById('marketplace-catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToEstimator = (e: React.MouseEvent) => {
    e.preventDefault();
    const estEl = document.getElementById('instant-estimator');
    if (estEl) {
      estEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className={styles.heroSection} aria-label="Saampark Digital Ecosystem Hero">
      {/* Procedural 3D WebGL Digital Architecture */}
      <SaamparkWorld />

      <div className={styles.heroContent}>
        {/* Eyebrow Status */}
        <div className={styles.eyebrowBadge}>
          <span className={styles.pulseDot} />
          <span>SAAMPARK DIGITAL ECOSYSTEM // ISO 9001:2015 CERTIFIED</span>
        </div>

        {/* Master Editorial Headline */}
        <h1 className={styles.masterHeadline}>
          Where Technology, Business &amp;{' '}
          <span className={styles.gradientHighlight}>Creativity Connect.</span>
        </h1>

        {/* Master Editorial Subtitle */}
        <p className={styles.masterSubtitle}>
          Enterprise software engineering, cross-platform mobile apps, cloud ERP systems, and strategic business transformation. Built with mathematical precision.
        </p>

        {/* Dual Divisions Pill Selector */}
        <div className={styles.divisionsDualityBar}>
          <a
            href="#technology"
            className={`${styles.divisionPill} ${styles.strPill}`}
            onClick={(e) => {
              e.preventDefault();
              if (onSelectDivision) onSelectDivision('technology');
              const el = document.getElementById('marketplace-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className={styles.divisionDotSTR} />
            <Globe size={14} />
            <span>STR // Technology &amp; Research</span>
          </a>

          <a
            href="#consultancy"
            className={`${styles.divisionPill} ${styles.scsPill}`}
            onClick={(e) => {
              e.preventDefault();
              if (onSelectDivision) onSelectDivision('consultancy');
              const el = document.getElementById('marketplace-catalog');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className={styles.divisionDotSCS} />
            <Briefcase size={14} />
            <span>SCS // Consultancy Service</span>
          </a>
        </div>

        {/* Primary Action Deck */}
        <div className={styles.actionDeck}>
          <a href="#marketplace-catalog" onClick={scrollToCatalog} className={styles.primaryAction}>
            <span>Explore All 39 Services</span>
            <ArrowRight size={16} />
          </a>

          <a href="#instant-estimator" onClick={scrollToEstimator} className={styles.secondaryAction}>
            <Calculator size={16} />
            <span>Instant Price Calculator</span>
          </a>
        </div>

        {/* Telemetry Stats Ribbon */}
        <div className={styles.telemetryRibbon}>
          <div className={styles.telemetryStat}>
            <span className={styles.statValue}>39</span>
            <span className={styles.statLabel}>Verified Solutions</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.telemetryStat}>
            <span className={styles.statValue}>99.98%</span>
            <span className={styles.statLabel}>SLA Uptime</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.telemetryStat}>
            <span className={styles.statValue}>ISO 9001:2015</span>
            <span className={styles.statLabel}>Government Certified</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.telemetryStat}>
            <span className={styles.statValue}>₹1.2Cr+</span>
            <span className={styles.statLabel}>Client Value Created</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.telemetryStat}>
            <span className={styles.statValue}>4.9 / 5.0</span>
            <span className={styles.statLabel}>Verified CSAT Score</span>
          </div>
        </div>
      </div>
    </section>
  );
}
