import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SERVICE_GROUPS } from '@/lib/data/services';
import { MarketplaceHome } from '@/components/features/MarketplaceHome/MarketplaceHome';

interface Props {
  params: Promise<{
    entity: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const entityId = resolvedParams.entity.toLowerCase();

  const groupMap: Record<string, { title: string; desc: string }> = {
    str: {
      title: 'Saampark Technology & Research (STR) | Web & Mobile App Development',
      desc: 'STR is the core software and technology division of Saampark Group, engineering web applications, Android & iOS mobile apps, custom ERPs, and cloud solutions.',
    },
    scs: {
      title: 'Saampark Consultancy Service (SCS) | Digital Marketing & Business Legal',
      desc: 'SCS is the strategic growth and marketing division of Saampark Group, managing Meta Ads, Google Search Ads, AI videos, and company GST legal registrations.',
    },
    technology: {
      title: 'Saampark Technology Services | Custom Websites & Software',
      desc: 'Browse custom web development, mobile app development, AI integration, and server hosting packages from Saampark Group.',
    },
    consultancy: {
      title: 'Saampark Consultancy Services | Marketing & Legal Growth',
      desc: 'Browse digital marketing, Meta Ads, AI video creation, and business legal setup packages from Saampark Group.',
    },
    research: {
      title: 'Saampark Research Services | Market Intelligence & Analysis',
      desc: 'Professional market research, financial analysis, and business intelligence services from Saampark Group.',
    },
  };

  const info = groupMap[entityId];
  if (!info) return { title: 'Saampark Group' };

  return {
    title: info.title,
    description: info.desc,
    keywords: [
      entityId.toUpperCase(),
      'Saampark',
      'Saampark Group',
      info.title,
      'web development',
      'app development',
      'digital marketing',
    ],
    alternates: {
      canonical: `https://www.saampark.com/${entityId}`,
    },
    openGraph: {
      title: info.title,
      description: info.desc,
      url: `https://www.saampark.com/${entityId}`,
      siteName: 'Saampark Group',
    },
  };
}

export default async function EntityPage({ params }: Props) {
  const resolvedParams = await params;
  const entityId = resolvedParams.entity.toLowerCase();
  const validEntities = ['str', 'scs', 'technology', 'consultancy', 'research'];

  if (!validEntities.includes(entityId)) {
    notFound();
  }

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 28px)' }}>
      <MarketplaceHome />
    </div>
  );
}
