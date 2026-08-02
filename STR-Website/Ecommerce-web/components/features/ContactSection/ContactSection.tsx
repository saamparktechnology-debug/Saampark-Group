'use client';

import React, { useState } from 'react';
import { Mail, Calculator } from 'lucide-react';
import { ContactForm } from '../ContactForm/ContactForm';
import { CostEstimator } from '../CostEstimator/CostEstimator';
import styles from './ContactSection.module.css';

export function ContactSection() {
  const [activeTab, setActiveTab] = useState<'message' | 'calculator'>('message');

  return (
    <div className={styles.sectionWrap}>
      {/* Tab Switcher */}
      <div className={styles.tabHeaders}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'message' ? styles.active : ''}`}
          onClick={() => setActiveTab('message')}
        >
          <Mail size={16} />
          <span>Send a Message</span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'calculator' ? styles.active : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={16} />
          <span>Cost & Time Estimator</span>
        </button>
      </div>

      {/* Content Panels */}
      <div className={styles.panelContent}>
        {activeTab === 'message' ? <ContactForm /> : <CostEstimator />}
      </div>
    </div>
  );
}
