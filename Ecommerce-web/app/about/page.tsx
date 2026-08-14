import type { Metadata } from 'next';
import { Hero }               from '@/components/sections/Hero/Hero';
import { AboutCommandCenter } from '@/components/features/AboutCommandCenter/AboutCommandCenter';
import { LiveStats }          from '@/components/sections/LiveStats/LiveStats';
import { LiveActivity }       from '@/components/sections/LiveActivity/LiveActivity';
import { TechStackShowcase }  from '@/components/sections/TechStackShowcase/TechStackShowcase';
import { CTASection }         from '@/components/sections/CTASection/CTASection';

export const metadata: Metadata = {
  title: 'About Saampark Group — ISO 9001:2015 Technology & Consultancy Group',
  description:
    'Learn about ISO 9001:2015 certified Saampark Group. Operating through STR (Saampark Technology & Research) and SCS (Saampark Consultancy Service) in West Bengal, India.',
  keywords: [
    'About Saampark Group',
    'Saampark Technology & Research',
    'Saampark Consultancy Service',
    'STR',
    'SCS',
    'ISO 9001:2015 certified tech company',
    'web development West Bengal',
  ],
  alternates: { canonical: 'https://www.saampark.com/about' },
  openGraph: {
    title: 'About Saampark Group | Technology & Consultancy Collective',
    description: 'ISO 9001:2015 certified technology & consultancy group powering businesses across India.',
    url: 'https://www.saampark.com/about',
    siteName: 'Saampark Group',
  },
};

export default function AboutPage() {
  return (
    <>
      {/* 1. Interactive Corporate Hero */}
      <Hero />

      {/* 2. Group structure & Divisions */}
      <AboutCommandCenter />

      {/* 3. Live Stats */}
      <LiveStats />

      {/* 4. Live Activity */}
      <LiveActivity />

      {/* 5. Tech Stack Showcase */}
      <TechStackShowcase />

      {/* 6. Final Call to Action */}
      <CTASection />
    </>
  );
}
