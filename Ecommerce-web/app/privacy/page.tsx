import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  GraduationCap,
  Database,
  Video,
  CreditCard,
  Lock,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  Smartphone,
} from 'lucide-react';
import { CONTACT } from '@/lib/data/services';
import styles from './PrivacyPage.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — Saampark Education',
  description:
    'Official Privacy Policy for the Saampark Education mobile application and learning platform operated by Saampark Group (Saampark Technology & Research Pvt. Ltd.).',
  keywords: [
    'Saampark Education Privacy Policy',
    'Saampark Education App',
    'Saampark Group Privacy Policy',
    'Play Console Privacy Policy',
  ],
  alternates: { canonical: 'https://www.saampark.com/privacy' },
  openGraph: {
    title: 'Privacy Policy | Saampark Education',
    description:
      'Learn how Saampark Education collects, uses, and protects student, teacher, and administrator information across courses and live classes.',
    url: 'https://www.saampark.com/privacy',
    siteName: 'Saampark Group',
    type: 'website',
  },
};

const LAST_UPDATED = 'November 27, 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.page}>
      <section className={styles.heroBanner}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className={styles.heroBadge}>
            <GraduationCap size={15} />
            Saampark Education Mobile Application
          </div>
          <h1 className="text-display-lg" style={{ marginBottom: 14 }}>
            Privacy Policy
          </h1>
          <p
            className="text-body-lg"
            style={{ color: 'rgba(255,255,255,0.78)', maxWidth: 680, margin: '0 auto' }}
          >
            This Privacy Policy explains how <strong>Saampark Education</strong>, operated by{' '}
            <strong>Saampark Technology &amp; Research Private Limited (Saampark Group)</strong>,
            collects, uses, stores, and protects personal data for students, teachers, and administrators.
          </p>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <Clock size={14} /> Effective Date: {LAST_UPDATED}
            </span>
            <span className={styles.heroMetaItem}>
              <ShieldCheck size={14} /> Applicable to Android App &amp; Web Portal
            </span>
          </div>
        </div>
      </section>

      <section className={`container ${styles.contentWrap}`}>
        <div className={styles.layout}>
          <article className={styles.mainCard}>
            <section id="overview" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <FileText size={18} />
                </span>
                <h2 className={styles.sectionTitle}>1. Overview &amp; Platform Roles</h2>
              </div>
              <p className={styles.paragraph}>
                <strong>Saampark Education</strong> is an online learning and live classroom platform
                developed and managed by <strong>Saampark Technology &amp; Research Private Limited</strong>{' '}
                (part of <strong>Saampark Group</strong>). By installing or using the Saampark Education
                application on Google Play or accessing connected web portals, you agree to the practices
                described in this Privacy Policy.
              </p>
              <div className={styles.roleGrid}>
                <div className={styles.roleBox}>
                  <h3 className={styles.roleTitle}>Student Accounts</h3>
                  <p className={styles.roleDesc}>
                    Browse courses, complete course purchases, join live interactive classes, view study
                    materials, track attendance, and receive academic updates.
                  </p>
                </div>
                <div className={styles.roleBox}>
                  <h3 className={styles.roleTitle}>Teacher Logins</h3>
                  <p className={styles.roleDesc}>
                    Authenticate into dedicated teacher portals to schedule and host live classes, share
                    course content, and interact with enrolled students.
                  </p>
                </div>
                <div className={styles.roleBox}>
                  <h3 className={styles.roleTitle}>Admin Management</h3>
                  <p className={styles.roleDesc}>
                    Authorized Saampark Education administrators oversee courses, enrollments, teacher
                    assignments, live schedules, billing verification, and safety moderation.
                  </p>
                </div>
              </div>
            </section>

            <section id="data-collected" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Database size={18} />
                </span>
                <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
              </div>
              <p className={styles.paragraph}>
                We collect only the information strictly necessary to deliver courses, live classes, account
                security, and administrative support:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Account &amp; Identity Data:</strong> Full name, email address, phone number, role
                  (Student, Teacher, or Admin), authentication credentials/OTP logs, and optional profile
                  photo or class/course details.
                </li>
                <li>
                  <strong>Course Purchase &amp; Transaction Data:</strong> Course enrollments, order IDs,
                  invoices, payment status, and support records. Online payments are processed via trusted,
                  PCI-DSS compliant third-party payment gateways; <strong>we do not store full debit/credit
                  card numbers, CVV codes, UPI PINs, or net-banking passwords.</strong>
                </li>
                <li>
                  <strong>Live Class &amp; Academic Activity:</strong> Attendance timestamps, live session chat
                  messages, questions asked during classes, and teacher-uploaded study resources or notes.
                </li>
                <li>
                  <strong>Device &amp; Technical Diagnostics:</strong> Device model, operating system version,
                  app version, IP address, crash reports, and push notification tokens (FCM) used exclusively
                  for app stability, security verification, and class/order notifications.
                </li>
              </ul>
            </section>

            <section id="permissions" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Smartphone size={18} />
                </span>
                <h2 className={styles.sectionTitle}>3. App Permissions We Request</h2>
              </div>
              <p className={styles.paragraph}>
                Saampark Education requests device permissions only when needed for specific educational features:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Camera &amp; Microphone:</strong> Used strictly when a Student or Teacher actively
                  joins or conducts a live interactive class. You can mute audio or disable camera anytime
                  inside the classroom controls or device settings.
                </li>
                <li>
                  <strong>Photos, Media &amp; Storage (Optional):</strong> Used when uploading a profile
                  avatar, teacher course files, or student assignment documents, or saving authorized study
                  notes and payment receipts.
                </li>
                <li>
                  <strong>Notifications:</strong> Used to alert Students and Teachers about upcoming live
                  classes, course enrollments, schedule changes, and security alerts.
                </li>
                <li>
                  <strong>Network &amp; Internet State:</strong> Required for streaming live classes, loading
                  courses, and syncing user accounts securely.
                </li>
              </ul>
            </section>

            <section id="how-we-use" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Video size={18} />
                </span>
                <h2 className={styles.sectionTitle}>4. How We Use Your Information</h2>
              </div>
              <ul className={styles.list}>
                <li>Authenticate Student, Teacher, and Admin accounts securely via password or OTP.</li>
                <li>Process course purchases, unlock enrolled classes, and generate payment receipts/invoices.</li>
                <li>Stream live teacher-led classes and maintain accurate attendance and course access records.</li>
                <li>Enable Admin teams to manage curriculum, resolve technical issues, and enforce platform conduct.</li>
                <li>Detect unauthorized logins, prevent account sharing/abuse, and fix application crashes.</li>
              </ul>
              <div className={styles.highlightBox}>
                <strong>No Sale of Personal Data:</strong> Saampark Education does <strong>not</strong> sell,
                rent, or trade student, teacher, or parent personal information to third-party advertisers,
                marketing agencies, or data brokers.
              </div>
            </section>

            <section id="sharing" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <CreditCard size={18} />
                </span>
                <h2 className={styles.sectionTitle}>5. Data Sharing &amp; Third-Party Services</h2>
              </div>
              <p className={styles.paragraph}>
                Data is shared only on a strict need-to-know basis with vetted infrastructure partners:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Authorized Teachers &amp; Admins:</strong> Teachers can see enrolled student names
                  and classroom participation for classes they teach; Admins can view enrollment, support,
                  and billing records to administer the platform.
                </li>
                <li>
                  <strong>Payment Processors:</strong> Payment gateways process course fees securely under their
                  own regulatory and PCI-DSS compliance obligations.
                </li>
                <li>
                  <strong>Cloud, Video Streaming &amp; Notification Providers:</strong> Reputable cloud servers,
                  live video SDKs, and email/push delivery partners (such as Firebase Cloud Messaging) operating
                  under confidentiality agreements.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Disclosure only where required by applicable Indian law,
                  court order, or government regulation.
                </li>
              </ul>
            </section>

            <section id="security" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Lock size={18} />
                </span>
                <h2 className={styles.sectionTitle}>6. Data Security &amp; Retention</h2>
              </div>
              <p className={styles.paragraph}>
                All communication between the Saampark Education app and our servers is encrypted using{' '}
                <strong>HTTPS / TLS</strong>. Passwords are stored using industry-standard cryptographic
                hashing, and administrative access is strictly protected by role-based access control.
              </p>
              <p className={styles.paragraph}>
                We retain your account and enrollment data only for as long as your account remains active or
                as needed to provide course access, resolve disputes, and comply with Indian accounting and
                tax record-keeping laws.
              </p>
            </section>

            <section id="children" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Users size={18} />
                </span>
                <h2 className={styles.sectionTitle}>7. Student &amp; Minor Privacy</h2>
              </div>
              <p className={styles.paragraph}>
                Students under 18 years of age should register and purchase courses with the knowledge and
                consent of a parent or legal guardian. We do not show third-party behavioral advertisements in
                Saampark Education. Parents or guardians may contact us at any time to review, update, or
                request deletion of a minor student&apos;s personal data.
              </p>
            </section>

            <section id="deletion" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <Trash2 size={18} />
                </span>
                <h2 className={styles.sectionTitle}>8. Your Rights &amp; Account Deletion</h2>
              </div>
              <p className={styles.paragraph}>
                Students and Teachers have the right to access, correct, or request permanent deletion of
                their account and personal profile data at any time:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>In-App / Admin Support:</strong> Use the account settings option in the app or submit
                  a deletion request directly to our Admin team.
                </li>
                <li>
                  <strong>Email Request:</strong> Send an email to{' '}
                  <a href={`mailto:${CONTACT.str.email}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                    {CONTACT.str.email}
                  </a>{' '}
                  from your registered email ID with the subject{' '}
                  <strong>&ldquo;Account Deletion Request — Saampark Education&rdquo;</strong>.
                </li>
                <li>
                  <strong>Processing Timeline:</strong> Verified account deletion requests are completed
                  within <strong>7 business days</strong> (and no later than 30 days). Only minimal statutory
                  tax/invoice records required under Indian law are retained securely.
                </li>
              </ul>
            </section>

            <section id="updates" className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>
                  <ShieldCheck size={18} />
                </span>
                <h2 className={styles.sectionTitle}>9. Policy Updates &amp; Contact</h2>
              </div>
              <p className={styles.paragraph}>
                We may update this Privacy Policy periodically as new features are introduced in Saampark
                Education. Any updates will be published on this page (<code>https://www.saampark.com/privacy</code>)
                with an updated Effective Date. For questions, privacy concerns, or grievance redressal, please
                reach out to our Grievance &amp; Privacy Officer using the contact card on this page.
              </p>
            </section>
          </article>

          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>
                <FileText size={17} /> Quick Navigation
              </h3>
              <nav className={styles.tocLinks}>
                <a href="#overview" className={styles.tocLink}>1. Overview &amp; Roles</a>
                <a href="#data-collected" className={styles.tocLink}>2. Information We Collect</a>
                <a href="#permissions" className={styles.tocLink}>3. App Permissions</a>
                <a href="#how-we-use" className={styles.tocLink}>4. How We Use Data</a>
                <a href="#sharing" className={styles.tocLink}>5. Data Sharing &amp; Partners</a>
                <a href="#security" className={styles.tocLink}>6. Security &amp; Retention</a>
                <a href="#children" className={styles.tocLink}>7. Student &amp; Minor Privacy</a>
                <a href="#deletion" className={styles.tocLink}>8. Account &amp; Data Deletion</a>
                <a href="#updates" className={styles.tocLink}>9. Updates &amp; Contact</a>
              </nav>
            </div>

            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}>
                <ShieldCheck size={17} /> Grievance &amp; Support Contact
              </h3>
              <div className={styles.contactStack}>
                <div>
                  <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>
                    {CONTACT.str.name}
                  </strong>
                  <span>Operator of Saampark Education</span>
                </div>
                <a href={`mailto:${CONTACT.str.email}`} className={styles.contactRow}>
                  <Mail size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{CONTACT.str.email}</span>
                </a>
                <a href={`mailto:${CONTACT.str.webEmail}`} className={styles.contactRow}>
                  <Mail size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{CONTACT.str.webEmail}</span>
                </a>
                <a href={CONTACT.str.tel1} className={styles.contactRow}>
                  <Phone size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>+91 {CONTACT.str.phone1} / {CONTACT.str.landline}</span>
                </a>
                <div className={styles.contactRow}>
                  <MapPin size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{CONTACT.group.address}</span>
                </div>
                <Link
                  href="/contact"
                  style={{
                    marginTop: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'var(--color-primary, #2563eb)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                  }}
                >
                  Contact Support Team
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
