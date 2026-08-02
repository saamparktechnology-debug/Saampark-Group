import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Footer } from '@/components/layout/Footer/Footer';
import { AIConsultant } from '@/components/features/AIConsultant/AIConsultant';
import { AuthModal } from '@/components/features/AuthModal/AuthModal';
import { RootWrapper } from './RootWrapper';

export const metadata: Metadata = {
  title: {
    default: 'Saampark Group | Website, App Development & Digital Marketing India',
    template: '%s | Saampark Group',
  },
  description:
    'ISO 9001:2015 certified Saampark Group offers website development, mobile app development, digital marketing, Meta Ads, Google Ads, and business legal services. Serving India from West Bengal. Starting ₹499.',
  keywords: [
    'website development West Bengal',
    'website development Paschim Medinipur',
    'digital marketing India',
    'Meta Ads management',
    'Google Ads management',
    'Android app development India',
    'Saampark Technology',
    'Saampark Consultancy',
    'GST registration West Bengal',
    'dynamic website India',
    'e-commerce website India',
    'AI video creation India',
    'Google Business Profile management',
    'ISO certified web development India',
  ],
  openGraph: {
    title: 'Saampark Group | Premium Technology & Consultancy',
    description:
      'ISO 9001:2015 certified Saampark Group — website development, app development, digital marketing, Meta Ads, Google Ads, video AI, and business legal services.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.saampark.com',
    siteName: 'Saampark Group',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saampark Group | Premium Technology & Consultancy',
    description: 'ISO certified premium digital services from West Bengal. Starting ₹499.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0D1B2A" />
      </head>
      <body>
        <RootWrapper>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AIConsultant />
          <AuthModal />
        </RootWrapper>
      </body>
    </html>
  );
}
