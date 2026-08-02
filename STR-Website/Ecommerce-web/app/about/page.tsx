import type { Metadata } from 'next';
import { Hero }               from '@/components/sections/Hero/Hero';
import { AboutCommandCenter } from '@/components/features/AboutCommandCenter/AboutCommandCenter';
import { LiveStats }          from '@/components/sections/LiveStats/LiveStats';
import { LiveActivity }       from '@/components/sections/LiveActivity/LiveActivity';
import { TechStackShowcase }  from '@/components/sections/TechStackShowcase/TechStackShowcase';
import { CTASection }         from '@/components/sections/CTASection/CTASection';

export const metadata: Metadata = {
  title: 'About Us | Technology & Consultancy Group',
  description:
    'ISO 9001:2015 certified Saampark Group is an enterprise collective empowering businesses through STR (Technology & Research) and SCS (Consultancy Services).',
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
