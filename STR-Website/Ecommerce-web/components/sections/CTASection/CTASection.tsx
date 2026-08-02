'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './CTASection.module.css';

export function CTASection() {
  return (
    <section className={styles.section}>
      <div className={styles.bg} />

      <div className={`container ${styles.inner}`}>
        <div className={styles.label}>Ready to Build?</div>

        <h2 className={styles.heading}>
          One Group.<br />
          <span className={styles.gradient}>Infinite Digital Possibilities.</span>
        </h2>

        <p className={styles.sub}>
          Whether you need a website, an app, digital marketing, or business legal support —<br />
          Saampark Group has the team, the tools, and the expertise.
        </p>

        <div className={styles.ctas}>
          <Link href="/marketplace" className="btn btn-primary btn-xl">
            Explore All Services <ArrowRight size={20} />
          </Link>
          <a href={CONTACT.str.whatsapp1} className={`btn btn-xl ${styles.waBtn}`}>
            <MessageCircle size={20} /> WhatsApp STR
          </a>
          <a href={CONTACT.scs.whatsapp} className={`btn btn-xl ${styles.waBtn}`}>
            <MessageCircle size={20} /> WhatsApp SCS
          </a>
        </div>

        <div className={styles.callLine}>
          Or call us directly:
          <a href={CONTACT.str.tel1} className={styles.callNum}>
            <Phone size={14} /> {CONTACT.str.phone1}
          </a>
          <span>·</span>
          <a href={CONTACT.scs.tel} className={styles.callNum}>
            <Phone size={14} /> {CONTACT.scs.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
