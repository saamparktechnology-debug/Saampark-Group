import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { Footer } from '@/components/layout/Footer/Footer';
import { AIConsultant } from '@/components/features/AIConsultant/AIConsultant';
import { AuthModal } from '@/components/features/AuthModal/AuthModal';
import { RootWrapper } from './RootWrapper';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.saampark.com'),
  title: {
    default: 'Saampark Group | Official Site — Web Development, App Development & Digital Marketing',
    template: '%s | Saampark Group',
  },
  description:
    'ISO 9001:2015 certified Saampark Group (STR & SCS) — Official provider for website development, mobile app development, custom ERP software, Meta Ads, Google Ads, AI videos & business legal registration in India. Packages starting ₹499.',
  keywords: [
    'Saampark',
    'Saampark Group',
    'Saampark Technology',
    'Saampark Consultancy',
    'STR',
    'SCS',
    'Saampark Technology & Research',
    'Saampark Consultancy Service',
    'website development India',
    'web development company West Bengal',
    'website development Paschim Medinipur',
    'mobile app development India',
    'Android app development company',
    'iOS app development India',
    'custom ERP software development',
    'digital marketing agency India',
    'Meta Ads management',
    'Google Ads agency India',
    'AI video creation India',
    'GST registration online West Bengal',
    'business legal services India',
    'ISO certified web agency',
  ],
  authors: [{ name: 'Saampark Group', url: 'https://www.saampark.com' }],
  creator: 'Saampark Technology & Research Pvt. Ltd.',
  publisher: 'Saampark Group',
  category: 'technology & business consultancy',
  alternates: {
    canonical: 'https://www.saampark.com',
  },
  icons: {
    icon: [
      { url: '/assets/logos/logo-main-v2.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/assets/logos/logo-main-v2.png',
    apple: '/assets/logos/logo-main-v2.png',
  },
  openGraph: {
    title: 'Saampark Group | Premier Web Development, App Development & Marketing',
    description:
      'ISO 9001:2015 certified Saampark Group — Official store for websites, mobile apps, software, Meta Ads, Google Ads & company registration starting at ₹499.',
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.saampark.com',
    siteName: 'Saampark Group',
    images: [
      {
        url: '/assets/logos/logo-main-v2.png',
        width: 1200,
        height: 1200,
        alt: 'Saampark Group Official Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saampark Group | Official Site — Web, App & Digital Marketing',
    description: 'ISO certified premium technology and consultancy services in India starting at ₹499.',
    images: ['/assets/logos/logo-main-v2.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="1Vi14y2mIkB06TUQjovW4U0-8Vz_BZB8z8W5cTN-HIk" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-B8VRWQVPDY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-B8VRWQVPDY');
          `}
        </Script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/assets/logos/logo-main-v2.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/assets/logos/logo-main-v2.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0D1B2A" />
        <JsonLd />
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
