'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Users, Grid3X3, Award } from 'lucide-react';
import { allServices } from '@/lib/data/services';
import styles from './LiveStats.module.css';

interface MetricItem {
  value: string;
  label: string;
  icon: 'CheckCircle' | 'Users' | 'Grid3X3' | 'Award';
}

const ICONS = { CheckCircle, Users, Grid3X3, Award };

const DEFAULT_METRICS: MetricItem[] = [
  { value: `${allServices.length}+`, label: 'Verified Service Packages', icon: 'Grid3X3' },
  { value: '2 Divisions', label: 'STR & SCS Specialized Arms', icon: 'Users' },
  { value: 'ISO 9001:2015', label: 'Certified Quality Process', icon: 'Award' },
  { value: '100% GST', label: 'Compliant Tax Invoicing', icon: 'CheckCircle' },
];

function StatCard({ value, label, icon }: MetricItem) {
  const Icon = ICONS[icon] ?? CheckCircle;
  return (
    <div className={styles.statCard}>
      <div className={styles.iconWrap}>
        <Icon size={24} />
      </div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statPulse} />
    </div>
  );
}

export function LiveStats() {
  const [metrics, setMetrics] = useState<MetricItem[]>(DEFAULT_METRICS);

  useEffect(() => {
    fetch('/api/storefront')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.success || !json?.data) return;
        const techCount = Array.isArray(json.data.products?.tech) ? json.data.products.tech.length : 0;
        const consultCount = Array.isArray(json.data.products?.consultancy)
          ? json.data.products.consultancy.length
          : 0;
        const totalLive = techCount + consultCount;
        const techStats = json.data.storefront?.tech?.liveStats;
        setMetrics([
          {
            value: totalLive > 0 ? `${totalLive} Services` : `${allServices.length}+`,
            label: 'Active Storefront Solutions',
            icon: 'Grid3X3',
          },
          {
            value: techStats?.clientSatisfaction || '99.4%',
            label: 'Delivery SLA Benchmark',
            icon: 'CheckCircle',
          },
          { value: 'ISO 9001:2015', label: 'Certified Quality System', icon: 'Award' },
          { value: 'STR + SCS', label: 'Tech & Consultancy Divisions', icon: 'Users' },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className={styles.section}>
      {/* Background */}
      <div className={styles.bg} />

      <div className="container">
        <div className={styles.header}>
          <div className="section-label" style={{ color: 'var(--primitive-teal-400)' }}>
            Verified Credentials
          </div>
          <h2 className={`text-display-lg ${styles.title}`}>
            Built on Certified Quality &amp; Dual-Division Focus
          </h2>
        </div>

        <div className={styles.grid}>
          {metrics.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
