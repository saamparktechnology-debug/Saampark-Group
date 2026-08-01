import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, MessageCircle, Globe } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className="container">
          <div className={styles.grid}>
            {/* Brand Column */}
            <div className={styles.brandCol}>
              <Link href="/" className={styles.brandLogo}>
                <Image
                  src="/assets/logos/logo-main.png"
                  alt="Saampark Group"
                  width={48}
                  height={48}
                  className={styles.logoImg}
                />
                <span>SAAMPARK GROUP</span>
              </Link>
              <p className={styles.brandDesc}>
                ISO 9001:2015 certified technology and consultancy group delivering
                digital excellence for businesses across India.
              </p>
              <div className={styles.iso}>
                <span className={styles.isoTag}>🏆 ISO 9001:2015</span>
                <span className={styles.isoTag}>📋 Pvt. Ltd. Registered</span>
              </div>
            </div>

            {/* STR Column */}
            <div className={styles.col}>
              <div className={styles.colHeader}>
                <Image
                  src="/assets/logos/str-logo.jpg"
                  alt="STR"
                  width={28}
                  height={28}
                  style={{ borderRadius: 6, objectFit: 'cover' }}
                />
                <span className={styles.colTitle}>Technology</span>
              </div>
              <nav className={styles.colLinks}>
                <Link href="/technology/web-development/one-page-website">One Page Website</Link>
                <Link href="/technology/web-development/static-website">Static Website</Link>
                <Link href="/technology/web-development/dynamic-website">Dynamic Website</Link>
                <Link href="/technology/web-development/ecommerce-website">E-Commerce Website</Link>
                <Link href="/technology/app-development/android">Android App</Link>
                <Link href="/technology/app-development/hybrid">Hybrid App</Link>
                <Link href="/technology/software/erp">ERP Software</Link>
              </nav>
              <div className={styles.contacts}>
                <a href={CONTACT.str.tel1} className={styles.contactLink}>
                  <Phone size={13} /> {CONTACT.str.phone1}
                </a>
                <a href={CONTACT.str.tel2} className={styles.contactLink}>
                  <Phone size={13} /> {CONTACT.str.phone2}
                </a>
                <a href={`mailto:${CONTACT.str.email}`} className={styles.contactLink}>
                  <Mail size={13} /> {CONTACT.str.email}
                </a>
                <a href={`https://${CONTACT.str.website}`} className={styles.contactLink}>
                  <Globe size={13} /> {CONTACT.str.website}
                </a>
                <a href={CONTACT.str.whatsapp1} className={`${styles.contactLink} ${styles.waLink}`}>
                  <MessageCircle size={13} /> WhatsApp STR
                </a>
              </div>
            </div>

            {/* SCS Column */}
            <div className={styles.col}>
              <div className={styles.colHeader}>
                <span style={{ fontSize: 20 }}>📊</span>
                <span className={styles.colTitle}>Consultancy</span>
              </div>
              <nav className={styles.colLinks}>
                <Link href="/consultancy/digital-marketing/social-media">Social Media Management</Link>
                <Link href="/consultancy/ads-management/meta-ads">Meta Ads</Link>
                <Link href="/consultancy/ads-management/google-ads">Google Ads</Link>
                <Link href="/consultancy/digital-marketing/google-business-profile">Google Business Profile</Link>
                <Link href="/consultancy/video-ai/full-ai-video">AI Video</Link>
                <Link href="/consultancy/business-legal/pvt-ltd-registration">Company Registration</Link>
                <Link href="/consultancy/business-legal/gst-registration">GST Registration</Link>
              </nav>
              <div className={styles.contacts}>
                <a href={CONTACT.scs.tel} className={styles.contactLink}>
                  <Phone size={13} /> {CONTACT.scs.phone}
                </a>
                <a href={`mailto:${CONTACT.scs.email}`} className={styles.contactLink}>
                  <Mail size={13} /> {CONTACT.scs.email}
                </a>
                <a href={`https://${CONTACT.scs.website}`} className={styles.contactLink}>
                  <Globe size={13} /> {CONTACT.scs.website}
                </a>
                <a href={CONTACT.scs.whatsapp} className={`${styles.contactLink} ${styles.waLink}`}>
                  <MessageCircle size={13} /> WhatsApp SCS
                </a>
              </div>
            </div>

            {/* Address + Quick Links */}
            <div className={styles.col}>
              <div className={styles.colHeader}>
                <MapPin size={18} />
                <span className={styles.colTitle}>Our Office</span>
              </div>
              <address className={styles.address}>
                <MapPin size={13} />
                {CONTACT.group.address}
              </address>
              <a href={`https://${CONTACT.group.website}`} className={styles.contactLink} style={{ marginTop: 8 }}>
                <Globe size={13} /> {CONTACT.group.website}
              </a>

              <div className={styles.quickTitle}>Quick Links</div>
              <nav className={styles.colLinks}>
                <Link href="/marketplace">Marketplace</Link>
                <Link href="/about">About Us</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/contact">Get a Quote</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p>© {new Date().getFullYear()} Saampark Group. All rights reserved.</p>
            <p>
              Saampark Technology &amp; Research Pvt. Ltd. &nbsp;·&nbsp; Saampark Consultancy Service
            </p>
            <p style={{ color: 'rgba(255,255,255,0.30)' }}>
              {CONTACT.str.iso}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
