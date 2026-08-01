'use client';

import React from 'react';
import { TECH_STACK } from '@/lib/data/services';
import styles from './TechStackShowcase.module.css';

export function TechStackShowcase() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header">
          <div className="section-label">🛠 Technologies We Use</div>
          <h2 className="text-display-md">
            Built with <span className="text-gradient-brand">Industry-Leading</span> Technology
          </h2>
        </div>

        <div className={styles.grid}>
          {TECH_STACK.map(tech => (
            <div key={tech.name} className={styles.techCard}>
              <div
                className={styles.dot}
                style={{ background: tech.color }}
              />
              <span className={styles.name}>{tech.name}</span>
              <span className={styles.cat}>{tech.category}</span>
            </div>
          ))}
        </div>

        <p className={styles.note}>
          + 20 more technologies for specialized projects
        </p>
      </div>
    </section>
  );
}
