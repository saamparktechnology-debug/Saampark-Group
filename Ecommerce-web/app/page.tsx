import type { Metadata } from 'next';
import { MarketplaceHome } from '@/components/features/MarketplaceHome/MarketplaceHome';
import { PromoRibbon }      from '@/components/sections/PromoRibbon/PromoRibbon';

export const metadata: Metadata = {
  title: 'Saampark Group — Official Storefront | Web, App Development & Marketing Services',
  description:
    'Buy ISO 9001:2015 certified services online from Saampark Group (STR & SCS): custom websites, Android/iOS apps, software ERPs, Meta Ads, Google Ads & company legal registration. Starting ₹499.',
  keywords: [
    'Saampark',
    'Saampark Group',
    'Saampark Storefront',
    'Saampark Technology',
    'Saampark Consultancy',
    'buy website development online',
    'buy mobile app development',
    'hire digital marketing agency India',
  ],
  alternates: { canonical: 'https://www.saampark.com' },
  openGraph: {
    title: 'Saampark Group | Official Digital Storefront',
    description: 'ISO 9001:2015 certified websites, mobile apps, digital marketing & company legal setup in India.',
    url: 'https://www.saampark.com',
    siteName: 'Saampark Group',
  },
};

export default function HomePage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 28px)' }}>
      <PromoRibbon />
      <MarketplaceHome />
    </div>
  );
}
