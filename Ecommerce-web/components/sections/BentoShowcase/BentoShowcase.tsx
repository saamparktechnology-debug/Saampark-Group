'use client';

import React, { useState } from 'react';
import {
  Code2,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Award,
  Zap,
  Cpu,
  Layers,
  ArrowUpRight,
  Sparkles,
  Terminal,
  Activity,
} from 'lucide-react';
import styles from './BentoShowcase.module.css';

export function BentoShowcase() {
  const [activeTab, setActiveTab] = useState<'tech' | 'growth' | 'legal'>('tech');

  return (
    <section className={styles.bentoSection} aria-label="Enterprise Capabilities Bento Grid">
      <div className={styles.header}>
        <span className={styles.badge}>
          <Sparkles size={13} /> CINEMATIC ARCHITECTURE
        </span>
        <h2 className={styles.title}>
          Engineered by <span className={styles.gradientText}>Uber-Grade Craftsmen</span>
        </h2>
        <p className={styles.subtitle}>
          Inspired by Aceternity, Horizon X and Bento design paradigms. Institutional performance with ISO 9001:2015 precision.
        </p>
      </div>

      <div className={styles.grid}>
        {/* BENTO TILE 1: Large Featured Architecture Tile (2x2) */}
        <div className={`${styles.bentoTile} ${styles.tileLarge}`}>
          <div className={styles.borderBeam} />
          <div className={styles.tileGlow} style={{ background: 'var(--color-brand-subtle)' }} />

          <div className={styles.tileHeader}>
            <div className={styles.tileIconWrap}>
              <Code2 size={22} className={styles.tealIcon} />
            </div>
            <span className={styles.chipTag}>NEXT.JS 15 + TURBOPACK</span>
          </div>

          <div className={styles.tileBody}>
            <h3 className={styles.tileTitle}>Enterprise Full-Stack Platforms</h3>
            <p className={styles.tileDesc}>
              Built on React Server Components, TypeScript, and edge runtime databases. Delivering sub-50ms TTFB and perfect 100 Lighthouse performance metrics.
            </p>

            {/* Interactive Live Code Terminal Mockup */}
            <div className={styles.terminalMockup}>
              <div className={styles.terminalBar}>
                <span className={styles.termDotRed} />
                <span className={styles.termDotYellow} />
                <span className={styles.termDotGreen} />
                <span className={styles.termPath}>saampark-core/engine.tsx</span>
              </div>
              <pre className={styles.codeSnippet}>
                <code>
                  <span className={styles.codeKeyword}>export async function</span>{' '}
                  <span className={styles.codeFunc}>deliverSolution</span>(config) &#123;{'\n'}
                  {'  '}<span className={styles.codeKeyword}>const</span> architecture = <span className={styles.codeKeyword}>await</span> auditISO9001(config);{'\n'}
                  {'  '}<span className={styles.codeKeyword}>return</span> compileWithTurbopack(architecture, &#123;{'\n'}
                  {'    '}latency: <span className={styles.codeNum}>&apos;&lt; 45ms&apos;</span>, ownership: <span className={styles.codeBool}>1.0</span>{'\n'}
                  {'  '}&#125;);{'\n'}
                  &#125;
                </code>
              </pre>
            </div>

            <div className={styles.metricRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>99.98%</span>
                <span className={styles.metricLabel}>Production Uptime</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>&lt; 50ms</span>
                <span className={styles.metricLabel}>Edge Latency</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricVal}>100%</span>
                <span className={styles.metricLabel}>Code Ownership</span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO TILE 2: Mobile Ecosystem (1x1) */}
        <div className={`${styles.bentoTile} ${styles.tileMedium}`}>
          <div className={styles.tileGlow} style={{ background: 'rgba(56, 189, 248, 0.2)' }} />

          <div className={styles.tileHeader}>
            <div className={styles.tileIconWrap}>
              <Smartphone size={20} className={styles.blueIcon} />
            </div>
            <span className={styles.chipTag}>60FPS FLUID MOTION</span>
          </div>

          <div className={styles.tileBody}>
            <h3 className={styles.tileTitle}>Native &amp; Hybrid Mobile</h3>
            <p className={styles.tileDesc}>
              Flutter cross-platform &amp; Swift/Kotlin architectures with hardware-accelerated animations and biometric auth.
            </p>

            <div className={styles.mobileSimWrap}>
              <div className={styles.mobilePill}>
                <Activity size={13} className={styles.pulseIcon} />
                <span>Zero Frame Drops • 120Hz Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO TILE 3: Growth & Performance Ads (1x1) */}
        <div className={`${styles.bentoTile} ${styles.tileMedium}`}>
          <div className={styles.tileGlow} style={{ background: 'rgba(245, 166, 35, 0.22)' }} />

          <div className={styles.tileHeader}>
            <div className={styles.tileIconWrap}>
              <TrendingUp size={20} className={styles.amberIcon} />
            </div>
            <span className={styles.chipTag}>4.8x AVG ROAS</span>
          </div>

          <div className={styles.tileBody}>
            <h3 className={styles.tileTitle}>Algorithmic Performance Ads</h3>
            <p className={styles.tileDesc}>
              Meta &amp; Google Ad campaigns managed with custom AI video creatives and automated conversion API tracking.
            </p>

            <div className={styles.roasGraphMini}>
              <div className={styles.barItem} style={{ height: '35%' }} />
              <div className={styles.barItem} style={{ height: '55%' }} />
              <div className={styles.barItem} style={{ height: '45%' }} />
              <div className={styles.barItem} style={{ height: '75%' }} />
              <div className={styles.barItem} style={{ height: '65%' }} />
              <div className={`${styles.barItem} ${styles.barActive}`} style={{ height: '95%' }} />
            </div>
          </div>
        </div>

        {/* BENTO TILE 4: Wide Institutional Trust Tile (Full Width / 3 Columns) */}
        <div className={`${styles.bentoTile} ${styles.tileWide}`}>
          <div className={styles.borderBeam} />
          <div className={styles.tileGlow} style={{ background: 'rgba(16, 185, 129, 0.18)' }} />

          <div className={styles.tileWideContent}>
            <div className={styles.tileWideLeft}>
              <div className={styles.tileHeader}>
                <div className={styles.tileIconWrap}>
                  <Award size={22} className={styles.greenIcon} />
                </div>
                <span className={styles.chipTag}>AUDITED QUALITY SYSTEM</span>
              </div>
              <h3 className={styles.tileTitle}>ISO 9001:2015 Institutional Compliance</h3>
              <p className={styles.tileDesc}>
                Operated under strictly certified software engineering procedures. From Paschim Medinipur headquarters and Kolkata labs to nationwide enterprise delivery.
              </p>
            </div>

            <div className={styles.badgeBadgesRow}>
              <div className={styles.certBadgePill}>
                <ShieldCheck size={16} /> 100% Legal Tax Invoices
              </div>
              <div className={styles.certBadgePill}>
                <Zap size={16} /> Rapid Staging URL Access
              </div>
              <div className={styles.certBadgePill}>
                <Layers size={16} /> NDA Protected IP Handover
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
