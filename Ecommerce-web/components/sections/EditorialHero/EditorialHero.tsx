'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, 
  Calculator, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  TrendingUp, 
  CheckCircle2, 
  Terminal, 
  Globe, 
  Briefcase, 
  Layers,
  Zap,
  BarChart3
} from 'lucide-react';
import { HeroNexus3D } from '@/components/3d/HeroNexus3D/HeroNexus3D';
import styles from './EditorialHero.module.css';

interface EditorialHeroProps {
  onSelectDivision?: (division: 'technology' | 'consultancy' | 'all') => void;
}

export function EditorialHero({ onSelectDivision }: EditorialHeroProps) {
  const [activeTab, setActiveTab] = useState<'str' | 'scs'>('str');
  const [stageMode, setStageMode] = useState<'3d' | 'ui'>('3d');

  const scrollToCatalog = (e: React.MouseEvent, division?: 'technology' | 'consultancy') => {
    e.preventDefault();
    if (division && onSelectDivision) {
      onSelectDivision(division);
    }
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
    <section className={styles.heroSection} aria-label="Saampark Digital Ecosystem Signature Hero">
      <div className={styles.heroMonolithCard}>
        {/* Ambient Decorative Accents */}
        <div className={styles.cardSheen} />
        <div className={styles.organicPattern} />

        <div className={styles.heroGrid}>
          {/* ────────────────────────────────────────────────────────
              LEFT COLUMN: EDITORIAL TYPOGRAPHY & VALUE PROPOSITION
             ──────────────────────────────────────────────────────── */}
          <div className={styles.leftContent}>
            {/* Top Eyebrow Badge */}
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot} />
              <span>SAAMPARK GROUP // ISO 9001:2015 CERTIFIED</span>
            </div>

            {/* Master Editorial Headline */}
            <h1 className={styles.headline}>
              Where Technology, Business &amp;{' '}
              <span className={styles.highlightWord}>
                Creativity
                <svg className={styles.curvedUnderline} viewBox="0 0 280 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 14C70 4 190 2 277 15" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                </svg>
              </span>{' '}
              Connect.
            </h1>

            {/* Editorial Description */}
            <p className={styles.description}>
              Enterprise software engineering, cross-platform mobile apps, cloud ERP systems, and strategic business transformation. Built with mathematical precision and delivered with verified government compliance.
            </p>

            {/* Primary Action Deck */}
            <div className={styles.actionRow}>
              <a 
                href="#marketplace-catalog" 
                onClick={(e) => scrollToCatalog(e)} 
                className={styles.primaryBtn}
              >
                <span>Explore All 39 Services</span>
                <ArrowRight size={16} />
              </a>

              <a 
                href="#instant-estimator" 
                onClick={scrollToEstimator} 
                className={styles.secondaryBtn}
              >
                <Calculator size={15} />
                <span>Price Calculator</span>
              </a>
            </div>

            {/* Division Quick Filter Pills */}
            <div className={styles.divisionQuickBar}>
              <span className={styles.divisionBarLabel}>Quick Select:</span>
              <button 
                type="button" 
                className={`${styles.divPill} ${activeTab === 'str' ? styles.divPillActive : ''}`}
                onClick={() => {
                  setActiveTab('str');
                  if (onSelectDivision) onSelectDivision('technology');
                }}
              >
                <Cpu size={13} />
                <span>STR // Technology (21)</span>
              </button>

              <button 
                type="button" 
                className={`${styles.divPill} ${activeTab === 'scs' ? styles.divPillActive : ''}`}
                onClick={() => {
                  setActiveTab('scs');
                  if (onSelectDivision) onSelectDivision('consultancy');
                }}
              >
                <TrendingUp size={13} />
                <span>SCS // Consultancy (18)</span>
              </button>
            </div>

            {/* Live Telemetry Numbers Strip */}
            <div className={styles.statsStrip}>
              <div className={styles.statBox}>
                <span className={styles.statNumber}>39</span>
                <span className={styles.statLabel}>Solutions</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statNumber}>99.98%</span>
                <span className={styles.statLabel}>SLA Uptime</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statNumber}>ISO 9001</span>
                <span className={styles.statLabel}>Certified</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statNumber}>4.9 / 5</span>
                <span className={styles.statLabel}>CSAT Score</span>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN: INTERACTIVE DEVICE & ECOSYSTEM PREVIEW
             ──────────────────────────────────────────────────────── */}
          <div className={styles.rightContent}>
            <div className={styles.previewStage}>
              {/* Ambient Kinetic Glow Orb */}
              <div className={styles.ambientDeviceGlow} />

              {/* Floating Top Badge */}
              {/* Floating Pulse Pill Removed per user request */}

              {/* Tab Selector on Device */}
              <div className={styles.deviceTabBar}>
                <button
                  type="button"
                  className={`${styles.deviceTab} ${activeTab === 'str' ? styles.activeDeviceTab : ''}`}
                  onClick={() => setActiveTab('str')}
                >
                  <Cpu size={14} />
                  <span>Technology (STR)</span>
                </button>
                <button
                  type="button"
                  className={`${styles.deviceTab} ${activeTab === 'scs' ? styles.activeDeviceTab : ''}`}
                  onClick={() => setActiveTab('scs')}
                >
                  <TrendingUp size={14} />
                  <span>Consultancy (SCS)</span>
                </button>
              </div>

              {/* Dynamic Interactive Monolith Frame */}
              <div className={styles.deviceFrame}>
                {activeTab === 'str' ? (
                  /* STR PREVIEW */
                  <div className={styles.tabContent}>
                    <div className={styles.frameHeader}>
                      <div className={styles.liveIndicator}>
                        <span className={styles.livePulse} />
                        <span>STR PRODUCTION ENGINE</span>
                      </div>

                      {/* 3D vs UI Toggle */}
                      <div className={styles.stageModeToggle}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${stageMode === '3d' ? styles.modeBtnActive : ''}`}
                          onClick={() => setStageMode('3d')}
                          title="Interactive 3D WebGL World"
                        >
                          <Sparkles size={11} />
                          <span>3D World</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${stageMode === 'ui' ? styles.modeBtnActive : ''}`}
                          onClick={() => setStageMode('ui')}
                          title="UI Production Preview"
                        >
                          <Globe size={11} />
                          <span>UI Live</span>
                        </button>
                      </div>

                      <span className={styles.slaBadge}>99.98% SLA</span>
                    </div>

                    <div className={styles.previewVisualCard}>
                      {stageMode === '3d' ? (
                        <div className={styles.nexus3DCard}>
                          <HeroNexus3D activeDivision="str" />
                        </div>
                      ) : (
                        <>
                          <Image 
                            src="/assets/images/services/str-web-dynamic.png" 
                            alt="STR Next.js Enterprise Storefront"
                            width={420}
                            height={230}
                            className={styles.previewImage}
                            unoptimized
                            priority
                          />
                          
                          {/* Live Kinetic Waveform Telemetry */}
                          <div className={styles.animatedWaveOverlay}>
                            <svg className={styles.liveWaveSvg} viewBox="0 0 300 70" fill="none">
                              <path
                                id="telemetryPathSTR"
                                d="M 0 45 Q 40 10, 90 40 T 180 20 T 300 35"
                                stroke="#38BDF8"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className={styles.wavePath}
                              />
                              <circle r="5" fill="#FFFFFF" className={styles.wavePulseHeadSTR} />
                            </svg>
                            <div className={styles.liveTickerBadge}>
                              <span className={styles.tickerVal}>5.20ms</span>
                              <span className={styles.tickerSub}>Edge Latency</span>
                            </div>
                          </div>

                          <div className={styles.floatingPreviewTag}>
                            <Zap size={13} className={styles.tagIcon} />
                            <span>Cloud Architecture • 99.98% SLA</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.techPillsGrid}>
                      <span className={styles.techPill}>Flutter Hybrid iOS/Android</span>
                      <span className={styles.techPill}>Cloud ERP &amp; Billing</span>
                      <span className={styles.techPill}>Agentic AI Pipelines</span>
                    </div>

                    <div className={styles.cardFooterAction}>
                      <div>
                        <span className={styles.priceIntro}>Starting from</span>
                        <span className={styles.footerPrice}>₹499 / solution</span>
                      </div>
                      <button
                        type="button"
                        className={styles.viewDivisionBtn}
                        onClick={(e) => scrollToCatalog(e, 'technology')}
                      >
                        <span>View All 21 STR Services</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SCS PREVIEW */
                  <div className={styles.tabContent}>
                    <div className={styles.frameHeader}>
                      <div className={styles.liveIndicator}>
                        <span className={`${styles.livePulse} ${styles.scsPulse}`} />
                        <span>SCS BUSINESS &amp; STRATEGY</span>
                      </div>

                      {/* 3D vs UI Toggle */}
                      <div className={styles.stageModeToggle}>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${stageMode === '3d' ? styles.modeBtnActive : ''}`}
                          onClick={() => setStageMode('3d')}
                          title="Interactive 3D WebGL World"
                        >
                          <Sparkles size={11} />
                          <span>3D World</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.modeBtn} ${stageMode === 'ui' ? styles.modeBtnActive : ''}`}
                          onClick={() => setStageMode('ui')}
                          title="UI Production Preview"
                        >
                          <Globe size={11} />
                          <span>UI Live</span>
                        </button>
                      </div>

                      <span className={`${styles.slaBadge} ${styles.scsSlaBadge}`}>MCA Verified</span>
                    </div>

                    <div className={styles.previewVisualCard}>
                      {stageMode === '3d' ? (
                        <div className={styles.nexus3DCard}>
                          <HeroNexus3D activeDivision="scs" />
                        </div>
                      ) : (
                        <>
                          <Image 
                            src="/assets/images/services/scs-social-standard.png" 
                            alt="SCS Meta & Google Ads Engine"
                            width={420}
                            height={230}
                            className={styles.previewImage}
                            unoptimized
                            priority
                          />

                          {/* Live Kinetic Waveform Telemetry */}
                          <div className={styles.animatedWaveOverlay}>
                            <svg className={styles.liveWaveSvg} viewBox="0 0 300 70" fill="none">
                              <path
                                id="telemetryPathSCS"
                                d="M 0 50 Q 50 15, 110 40 T 210 25 T 300 30"
                                stroke="#FFC93C"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className={styles.wavePath}
                              />
                              <circle r="5" fill="#FFFFFF" className={styles.wavePulseHeadSCS} />
                            </svg>
                            <div className={styles.liveTickerBadge}>
                              <span className={`${styles.tickerVal} ${styles.yellowTicker}`}>4.8x</span>
                              <span className={styles.tickerSub}>ROAS Multiplier</span>
                            </div>
                          </div>

                          <div className={styles.floatingPreviewTag}>
                            <BarChart3 size={13} className={styles.tagIcon} />
                            <span>ROAS 4.8x • Performance Ads</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.techPillsGrid}>
                      <span className={styles.techPill}>4K AI Video &amp; Voiceover</span>
                      <span className={styles.techPill}>Pvt Ltd &amp; LLP Govt Filing</span>
                      <span className={styles.techPill}>GST &amp; ISO Certification</span>
                    </div>

                    <div className={styles.cardFooterAction}>
                      <div>
                        <span className={styles.priceIntro}>Starting from</span>
                        <span className={styles.footerPrice}>₹999 / campaign</span>
                      </div>
                      <button
                        type="button"
                        className={`${styles.viewDivisionBtn} ${styles.scsViewBtn}`}
                        onClick={(e) => scrollToCatalog(e, 'consultancy')}
                      >
                        <span>View All 18 SCS Services</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Bottom Card (Pace style) */}
              <div className={styles.floatingBottomCard}>
                <div className={styles.bottomCardDot} />
                <div>
                  <span className={styles.bottomCardTitle}>
                    {activeTab === 'str' ? '99.98% SLA Enterprise Uptime' : '100% MCA Govt Approved Registration'}
                  </span>
                  <span className={styles.bottomCardSub}>
                    {activeTab === 'str' ? 'Zero downtime guaranteed architecture' : 'Incorporation, PAN, TAN & GST filings'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}