import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Video,
  BookOpen,
  ShieldCheck,
  Users,
  CheckCircle2,
  UserCheck,
  Settings,
  Smartphone,
  CreditCard,
  Clock,
  FileText,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './EducationPage.module.css';

export const metadata: Metadata = {
  title: 'Saampark Education — Online Courses & Live Interactive Classes',
  description:
    'Official Saampark Education learning app & portal by Saampark Group. Students can purchase courses and attend live classes with dedicated Teacher login and Admin management.',
  keywords: [
    'Saampark Education',
    'Saampark Education App',
    'Online Courses India',
    'Live Classes App',
    'Saampark Group Education',
    'Saampark Technology & Research',
  ],
  alternates: { canonical: 'https://www.saampark.com/education' },
  openGraph: {
    title: 'Saampark Education | Courses, Live Classes & Learning Portal',
    description:
      'Complete digital learning ecosystem for Students, Teachers, and Administrators by Saampark Group.',
    url: 'https://www.saampark.com/education',
    siteName: 'Saampark Group',
    type: 'website',
  },
};

export default function EducationPage() {
  return (
    <div className={styles.page}>
      <section className={styles.heroBanner}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroBadge}>
              <GraduationCap size={15} />
              Saampark Education Platform
            </div>
            <h1 className={styles.heroTitle}>
              Learn Live. Master Skills with Saampark Education.
            </h1>
            <p className={styles.heroSub}>
              An all-in-one learning ecosystem built by{' '}
              <strong>Saampark Technology &amp; Research Private Limited (Saampark Group)</strong>.
              Students can purchase structured courses and join live classes seamlessly, backed by a
              dedicated Teacher portal and centralized Admin control.
            </p>
            <div className={styles.heroActions}>
              <Link href="/contact" className={styles.primaryBtn}>
                Enquire or Request Access <ArrowRight size={16} />
              </Link>
              <Link href="/privacy" className={styles.secondaryBtn}>
                <ShieldCheck size={16} /> App Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className={`container ${styles.mainSection}`}>
        {/* 3 Core Portals / Roles */}
        <section className={styles.rolesGrid}>
          <div className={styles.glassCard}>
            <div
              className={styles.iconBox}
              style={{ background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb' }}
            >
              <BookOpen size={22} />
            </div>
            <h2 className={styles.cardTitle}>Student Learning App</h2>
            <p className={styles.cardDesc}>
              Designed for effortless learning from mobile or web with instant course enrollment and
              live interactive sessions.
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Browse courses and complete secure course purchases</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Join live interactive classes &amp; view class schedules</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Access notes, assignments, recorded replays &amp; receipts</span>
              </li>
            </ul>
          </div>

          <div className={styles.glassCard}>
            <div
              className={styles.iconBox}
              style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed' }}
            >
              <UserCheck size={22} />
            </div>
            <h2 className={styles.cardTitle}>Teacher Login Portal</h2>
            <p className={styles.cardDesc}>
              Educators log in with dedicated Teacher credentials to host live classes and guide
              enrolled student batches.
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Start &amp; manage scheduled live audio/video classes</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Upload study materials, PDFs, and practice tasks</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Track batch attendance and answer student doubts live</span>
              </li>
            </ul>
          </div>

          <div className={styles.glassCard}>
            <div
              className={styles.iconBox}
              style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
            >
              <Settings size={22} />
            </div>
            <h2 className={styles.cardTitle}>Admin Control Center</h2>
            <p className={styles.cardDesc}>
              Centralized management where authorized Saampark Education administrators oversee every
              academic and billing workflow.
            </p>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Publish courses, set pricing &amp; assign teachers to batches</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Verify enrollments, invoices &amp; student/teacher accounts</span>
              </li>
              <li className={styles.bulletItem}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                <span>Moderate classrooms, support queries &amp; platform security</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Core Platform Capabilities */}
        <section>
          <div className={styles.sectionHeadingWrap}>
            <h2 className={styles.sectionTitle}>Built for Modern Online Education</h2>
            <p className={styles.sectionSub}>
              Reliable live classroom technology combined with transparent billing, role-based access,
              and strong student data protection.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <Video size={22} style={{ color: '#2563eb' }} />
              <h3 className={styles.featureTitle}>Live Interactive Classes</h3>
              <p className={styles.featureDesc}>
                Real-time teacher-led video classes with low-latency audio/video, classroom chat, and
                instant doubt resolution.
              </p>
            </div>

            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <CreditCard size={22} style={{ color: '#059669' }} />
              <h3 className={styles.featureTitle}>Instant Course Purchase</h3>
              <p className={styles.featureDesc}>
                Students purchase courses securely via compliant payment gateways with automated
                enrollment unlock and invoice receipts.
              </p>
            </div>

            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <Smartphone size={22} style={{ color: '#7c3aed' }} />
              <h3 className={styles.featureTitle}>Mobile &amp; App Ready</h3>
              <p className={styles.featureDesc}>
                Optimized for Android smartphones with push reminders before live classes begin so
                students never miss a session.
              </p>
            </div>

            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <Users size={22} style={{ color: '#ea580c' }} />
              <h3 className={styles.featureTitle}>Dedicated Role Access</h3>
              <p className={styles.featureDesc}>
                Strict separation between Student, Teacher, and Admin logins ensures classroom
                content and admin operations stay protected.
              </p>
            </div>

            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <Clock size={22} style={{ color: '#0284c7' }} />
              <h3 className={styles.featureTitle}>Schedules &amp; Attendance</h3>
              <p className={styles.featureDesc}>
                Automated batch timetables, live session logs, and ongoing progress visibility for
                educators and administrators.
              </p>
            </div>

            <div className={`${styles.glassCard} ${styles.featureItem}`}>
              <ShieldCheck size={22} style={{ color: '#10b981' }} />
              <h3 className={styles.featureTitle}>Privacy &amp; Data Safety</h3>
              <p className={styles.featureDesc}>
                HTTPS/TLS encrypted communication, zero third-party ad tracking, and full user rights
                for account &amp; data deletion.
              </p>
            </div>
          </div>
        </section>

        {/* Publisher & Play Console Verification Box */}
        <section className={styles.glassCard}>
          <div className={styles.infoBanner}>
            <div className={styles.infoText}>
              <h3>Official Developer &amp; Support Details</h3>
              <p>
                <strong>Saampark Education</strong> is developed and operated by{' '}
                <strong>{CONTACT.str.name}</strong> ({CONTACT.group.address}). For course support,
                teacher onboarding, or data/privacy inquiries, contact{' '}
                <strong>{CONTACT.str.email}</strong> or call <strong>+91 {CONTACT.str.phone1}</strong>.
              </p>
            </div>
            <div className={styles.infoLinks}>
              <Link href="/privacy" className={styles.primaryBtn}>
                <FileText size={15} /> Read Privacy Policy
              </Link>
              <a href={`mailto:${CONTACT.str.email}`} className={styles.darkOutlineBtn}>
                <Mail size={15} /> Email Support
              </a>
              <a href={CONTACT.str.tel1} className={styles.darkOutlineBtn}>
                <Phone size={15} /> +91 {CONTACT.str.phone1}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
