import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import { ContactSection } from '@/components/features/ContactSection/ContactSection';
import styles from './ContactPage.module.css';

export const metadata: Metadata = {
  title: 'Contact Saampark Group — Free Tech & Marketing Consultation',
  description: 'Book a free consultation with Saampark Group (STR & SCS) experts for website development, app development, Meta Ads & legal registration inquiries in India.',
  keywords: [
    'Contact Saampark Group',
    'Saampark contact number',
    'Saampark Technology email',
    'Saampark Consultancy contact',
    'web development quotation India',
  ],
  alternates: { canonical: 'https://www.saampark.com/contact' },
  openGraph: {
    title: 'Contact Saampark Group | Free Technical & Business Consultation',
    description: 'Get in touch with Saampark Group for instant project estimations and expert consultation.',
    url: 'https://www.saampark.com/contact',
    siteName: 'Saampark Group',
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <section className={styles.heroBanner}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 className="text-display-lg" style={{ marginBottom: 16 }}>Let&apos;s Build Something Great</h1>
          <p className="text-body-lg" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 600, margin: '0 auto' }}>
            Book a free consultation with our experts. Calculate project costs or send us a message.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
        <div className={styles.grid}>
          
          {/* Form Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-8)', minWidth: 0 }}>
            <ContactSection />
          </div>

          {/* Info Side */}
          <div className={styles.infoStack}>
            {/* Tech (STR) */}
            <div className={styles.infoCard}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Technology Division (STR)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                <a href={CONTACT.str.tel1} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
                  <Phone size={16} /> {CONTACT.str.phone1}
                </a>
                <a href={`mailto:${CONTACT.str.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none', wordBreak: 'break-word' }}>
                  <Mail size={16} style={{ flexShrink: 0 }} /> {CONTACT.str.email}
                </a>
                <a href={CONTACT.str.whatsapp1} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                  <MessageCircle size={16} /> WhatsApp STR
                </a>
              </div>
            </div>

            {/* Consultancy (SCS) */}
            <div className={styles.infoCard}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Consultancy Division (SCS)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                <a href={CONTACT.scs.tel} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}>
                  <Phone size={16} /> {CONTACT.scs.phone}
                </a>
                <a href={`mailto:${CONTACT.scs.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none', wordBreak: 'break-word' }}>
                  <Mail size={16} style={{ flexShrink: 0 }} /> {CONTACT.scs.email}
                </a>
                <a href={CONTACT.scs.whatsapp} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                  <MessageCircle size={16} /> WhatsApp SCS
                </a>
              </div>
            </div>

            {/* Office */}
            <div className={styles.infoCard}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Corporate Office
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--color-text-secondary)', fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                  <MapPin size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                  {CONTACT.group.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} /> Mon - Sat, 10:00 AM - 7:00 PM
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
