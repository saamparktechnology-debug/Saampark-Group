'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import styles from './InteractiveFAQ.module.css';

const FAQ_ITEMS = [
  {
    q: 'How does buying services through Saampark Group storefront work?',
    a: 'You can browse any of our 39 standardized digital services across Saampark Technology (STR) and Saampark Consultancy (SCS). Click "Add to Cart" or "Get a Quote", complete the checkout or consultation form, and our certified project team initiates kick-off within 24 hours with dedicated project milestone tracking.',
    category: 'Ordering & Onboarding',
  },
  {
    q: 'Do I get 100% full source code and intellectual property (IP) rights?',
    a: 'Yes, absolutely. Every custom website, mobile application, software ERP, and digital asset developed by Saampark Group is delivered with 100% intellectual property ownership and full commercial usage rights handed over to your company upon project sign-off. Zero vendor lock-in.',
    category: 'Ownership & Legal',
  },
  {
    q: 'Are Saampark Technology and Consultancy ISO 9001:2015 certified?',
    a: 'Yes. Saampark Technology & Research Pvt. Ltd. (STR) and Saampark Consultancy Service (SCS) operate under internationally audited ISO 9001:2015 Quality Management Systems, ensuring institutional coding standards, stringent QA audits, and OWASP security compliance.',
    category: 'Quality & Certifications',
  },
  {
    q: 'How fast can a website or mobile application be delivered?',
    a: 'Delivery timelines range from 3-5 days for Single-Page and Dynamic Business Sites, 7-12 days for E-Commerce portals and Hybrid Flutter Apps, to custom agile milestones for complex ERPs. You receive a staging server URL to preview live progress in real-time.',
    category: 'Timelines & Sprints',
  },
  {
    q: 'Can I get customized features not listed in the standard packages?',
    a: 'Yes! While our catalog standardizes the most popular corporate requirements starting from ₹499, we provide bespoke development for custom APIs, AI models, payment integrations, and ERP modules. You can use our interactive Cost Estimator or speak to our technical architect for a free scope blueprint.',
    category: 'Custom Solutions',
  },
  {
    q: 'What post-launch maintenance, hosting, and warranty support is provided?',
    a: 'All web and application projects include free warranty bug-fix support, SSL certification, server deployment assistance, and optional monthly maintenance plans covering 24/7 uptime monitoring, regular security patches, and database backups.',
    category: 'Support & Maintenance',
  },
];

export function InteractiveFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section className={styles.faqSection} aria-labelledby="faqHeading">
      <div className={styles.header}>
        <span className={styles.eyebrowBadge}>
          <HelpCircle size={13} /> FREQUENTLY ASKED QUESTIONS
        </span>
        <h2 id="faqHeading" className={styles.title}>
          Everything You Need to Know About <span className={styles.gradientText}>Saampark Services</span>
        </h2>
        <p className={styles.subtitle}>
          Clear, transparent answers on pricing, delivery sprints, source code ownership, and ISO certified quality.
        </p>
      </div>

      <div className={styles.faqGrid}>
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
              onClick={() => toggleItem(idx)}
            >
              <div className={styles.questionRow}>
                <div className={styles.questionLeft}>
                  <span className={styles.catBadge}>{item.category}</span>
                  <h3 className={styles.questionText}>{item.q}</h3>
                </div>
                <button
                  type="button"
                  className={`${styles.chevronBtn} ${isOpen ? styles.chevronRotated : ''}`}
                  aria-expanded={isOpen}
                  aria-label="Toggle answer"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              <div className={`${styles.answerWrap} ${isOpen ? styles.answerOpen : ''}`}>
                <p className={styles.answerText}>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.supportCTA}>
        <div className={styles.supportLeft}>
          <Sparkles size={20} className={styles.supportIcon} />
          <div>
            <h4 className={styles.supportHeading}>Have a specific custom project in mind?</h4>
            <p className={styles.supportSub}>Speak directly with our Chief Technology Architect for a free 30-min strategy roadmap.</p>
          </div>
        </div>
        <a
          href="https://wa.me/917602058323?text=Hi%20Saampark%20Team,%20I%20have%20a%20project%20query"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.supportBtn}
        >
          <MessageCircle size={16} /> Instant WhatsApp Consult <ArrowRight size={14} />
        </a>
      </div>
    </section>
  );
}
