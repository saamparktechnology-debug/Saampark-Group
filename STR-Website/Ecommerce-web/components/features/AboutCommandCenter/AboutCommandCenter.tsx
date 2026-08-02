'use client';

import React from 'react';
import Image from 'next/image';
import { Shield, Award, Users, Globe, Target, Rocket } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './AboutCommandCenter.module.css';

export function AboutCommandCenter() {
  return (
    <div className={styles.wrapper}>

      {/* ── Group Structure ── */}
      <section className={styles.section}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <h2 className="text-display-md">The Power of Two Divisions</h2>
            <p className="text-body-lg" style={{ color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto', marginTop: 16 }}>
              Saampark Group operates through two specialized entities, ensuring you get expert focus whether you need deep tech or strategic marketing.
            </p>
          </div>

          <div className={styles.divisionsGrid}>
            
            {/* STR */}
            <div className={`${styles.divisionCard} ${styles.str}`}>
              <div className={styles.divHeader}>
                <Image src="/assets/logos/str-logo.jpg" alt="STR Logo" width={48} height={48} className={styles.divLogo} />
                <div className={styles.divTitleWrap}>
                  <h3 className={styles.divTitle}>STR</h3>
                  <div className={styles.divSub}>Saampark Technology & Research Pvt. Ltd.</div>
                </div>
              </div>
              <p className={styles.divDesc}>
                Our core technology arm responsible for engineering robust websites, native applications, and complex enterprise software systems.
              </p>
              <ul className={styles.divList}>
                <li><Rocket size={16} /> Web & App Development</li>
                <li><Rocket size={16} /> Custom ERP & CRM</li>
                <li><Rocket size={16} /> Cloud Infrastructure</li>
              </ul>
            </div>

            {/* SCS */}
            <div className={`${styles.divisionCard} ${styles.scs}`}>
              <div className={styles.divHeader}>
                <div className={styles.scsLogoBox}>SCS</div>
                <div className={styles.divTitleWrap}>
                  <h3 className={styles.divTitle}>SCS</h3>
                  <div className={styles.divSub}>Saampark Consultancy Service</div>
                </div>
              </div>
              <p className={styles.divDesc}>
                Our strategic business and marketing arm, driving growth through data-driven campaigns, social media, and digital branding.
              </p>
              <ul className={styles.divList}>
                <li><Target size={16} /> Digital Marketing & Ads</li>
                <li><Target size={16} /> AI Video Creation</li>
                <li><Target size={16} /> Company & GST Registration</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className={`${styles.section} ${styles.valuesSection}`}>
        <div className="container">
          <h2 className="text-display-md" style={{ textAlign: 'center', marginBottom: 48, color: 'white' }}>
            Our Core Values
          </h2>
          
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <Shield size={32} className={styles.valueIcon} />
              <h4 className={styles.valueTitle}>ISO 9001:2015 Quality</h4>
              <p className={styles.valueText}>Uncompromising international standards in every line of code and every campaign.</p>
            </div>
            <div className={styles.valueCard}>
              <Award size={32} className={styles.valueIcon} />
              <h4 className={styles.valueTitle}>Excellence</h4>
              <p className={styles.valueText}>We don't just build; we craft premium digital experiences that stand out.</p>
            </div>
            <div className={styles.valueCard}>
              <Users size={32} className={styles.valueIcon} />
              <h4 className={styles.valueTitle}>Client Partnership</h4>
              <p className={styles.valueText}>Your success is our success. We provide dedicated, direct support at every step.</p>
            </div>
            <div className={styles.valueCard}>
              <Globe size={32} className={styles.valueIcon} />
              <h4 className={styles.valueTitle}>Pan-India Impact</h4>
              <p className={styles.valueText}>Empowering businesses from local startups to national enterprises.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
