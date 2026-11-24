'use client';

import React, { useState } from 'react';
import { 
  Code2, 
  Cpu, 
  Terminal, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  BarChart3, 
  ArrowRight, 
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import styles from './DivisionsShowcase.module.css';

interface DivisionsShowcaseProps {
  onSelectDivision?: (division: 'technology' | 'consultancy') => void;
}

export function DivisionsShowcase({ onSelectDivision }: DivisionsShowcaseProps) {
  const [activeSide, setActiveSide] = useState<'both' | 'str' | 'scs'>('both');

  const handleSelect = (division: 'technology' | 'consultancy') => {
    if (onSelectDivision) {
      onSelectDivision(division);
    }
    const catalogEl = document.getElementById('marketplace-catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className={styles.section} aria-label="Two Divisions Showcase">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>
            <Layers size={13} />
            <span>TWO WORLDS // ONE ECOSYSTEM</span>
          </span>
          <h2 className={styles.headline}>
            Specialized Engineering Meets Strategic Growth
          </h2>
          <p className={styles.subheadline}>
            Saampark operates two dedicated powerhouses. Choose your path to explore verified architectural solutions or high-ROI business growth.
          </p>
        </div>

        {/* Dual World Split Portals */}
        <div className={styles.portalsGrid}>
          {/* ────────────────────────────────────────────────────────
              PORTAL 1: STR (Saampark Technology & Research)
             ──────────────────────────────────────────────────────── */}
          <div 
            className={`${styles.portalCard} ${styles.strCard} ${activeSide === 'str' ? styles.cardExpanded : ''}`}
            onMouseEnter={() => setActiveSide('str')}
            onMouseLeave={() => setActiveSide('both')}
          >
            <div className={styles.ambientGlowSTR} />
            <div className={styles.cyberGridLines} />

            <div className={styles.cardHeader}>
              <div className={styles.divisionPillSTR}>
                <span className={styles.pulseDotBlue} />
                <span>STR // ENGINEERING CORE</span>
              </div>
              <div className={styles.nodeCounter}>21 ACTIVE NODES</div>
            </div>

            <div className={styles.entityTitleWrap}>
              <div className={styles.iconCircleSTR}>
                <Cpu size={28} />
              </div>
              <div>
                <h3 className={styles.entityName}>Saampark Technology &amp; Research</h3>
                <span className={styles.entitySlug}>Pvt. Ltd. • ISO 9001:2015</span>
              </div>
            </div>

            <p className={styles.entityDesc}>
              Deep software engineering, multi-platform applications, cloud ERP ecosystems, and autonomous AI agents architected for hyper-scale and 99.98% SLA uptime.
            </p>

            {/* Architecture Highlights */}
            <div className={styles.specChipsWrap}>
              <span className={styles.specChip}>Next.js 16 (Turbopack)</span>
              <span className={styles.specChip}>Flutter Hybrid iOS/Android</span>
              <span className={styles.specChip}>Cloud ERP &amp; Billing</span>
              <span className={styles.specChip}>Agentic LLM Pipelines</span>
              <span className={styles.specChip}>Zero-Trust DevOps</span>
            </div>

            {/* Live Metrics */}
            <div className={styles.metricsBar}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>99.98%</span>
                <span className={styles.metricLabel}>Production SLA</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>21</span>
                <span className={styles.metricLabel}>Verified Solutions</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>₹499</span>
                <span className={styles.metricLabel}>Entry Tier</span>
              </div>
            </div>

            {/* Direct CTA */}
            <button 
              type="button" 
              className={styles.ctaButtonSTR}
              onClick={() => handleSelect('technology')}
            >
              <span>Explore STR Engineering Solutions</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* ────────────────────────────────────────────────────────
              PORTAL 2: SCS (Saampark Consultancy Service)
             ──────────────────────────────────────────────────────── */}
          <div 
            className={`${styles.portalCard} ${styles.scsCard} ${activeSide === 'scs' ? styles.cardExpanded : ''}`}
            onMouseEnter={() => setActiveSide('scs')}
            onMouseLeave={() => setActiveSide('both')}
          >
            <div className={styles.ambientGlowSCS} />
            <div className={styles.editorialPatternLines} />

            <div className={styles.cardHeader}>
              <div className={styles.divisionPillSCS}>
                <span className={styles.pulseDotSCS} />
                <span>SCS // STRATEGY &amp; GROWTH</span>
              </div>
              <div className={styles.nodeCounterSCS}>18 ACTIVE SERVICES</div>
            </div>

            <div className={styles.entityTitleWrap}>
              <div className={styles.iconCircleSCS}>
                <TrendingUp size={28} />
              </div>
              <div>
                <h3 className={styles.entityNameSCS}>Saampark Consultancy Service</h3>
                <span className={styles.entitySlugSCS}>Strategic &amp; Legal Division • ISO Certified</span>
              </div>
            </div>

            <p className={styles.entityDescSCS}>
              ROI-driven performance marketing, high-production 4K AI video campaigns, and government-certified company registrations, GST filings, and MCA legal compliance.
            </p>

            {/* Strategy Highlights */}
            <div className={styles.specChipsWrap}>
              <span className={styles.specChipSCS}>Meta &amp; Google Ads Engine</span>
              <span className={styles.specChipSCS}>4K AI Video &amp; Voiceover</span>
              <span className={styles.specChipSCS}>Pvt Ltd &amp; LLP Govt Formation</span>
              <span className={styles.specChipSCS}>GST &amp; MSME Compliance</span>
              <span className={styles.specChipSCS}>Verified Lead Pipeline</span>
            </div>

            {/* Live Metrics */}
            <div className={styles.metricsBarSCS}>
              <div className={styles.metricItem}>
                <span className={styles.metricValueSCS}>4.8x</span>
                <span className={styles.metricLabelSCS}>Average ROAS</span>
              </div>
              <div className={styles.metricDividerSCS} />
              <div className={styles.metricItem}>
                <span className={styles.metricValueSCS}>18</span>
                <span className={styles.metricLabelSCS}>Verified Services</span>
              </div>
              <div className={styles.metricDividerSCS} />
              <div className={styles.metricItem}>
                <span className={styles.metricValueSCS}>100%</span>
                <span className={styles.metricLabelSCS}>Govt MCA Compliant</span>
              </div>
            </div>

            {/* Direct CTA */}
            <button 
              type="button" 
              className={styles.ctaButtonSCS}
              onClick={() => handleSelect('consultancy')}
            >
              <span>Explore SCS Growth &amp; Legal Services</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}