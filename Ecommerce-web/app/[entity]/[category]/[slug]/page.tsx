import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { allServices } from '@/lib/data/services';
import { ServiceDetail } from '@/components/features/ServiceDetail/ServiceDetail';

interface Props {
  params: Promise<{
    entity: string;
    category: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const currentPath = `/${resolvedParams.entity}/${resolvedParams.category}/${resolvedParams.slug}`;
  const service = allServices.find(s => s.href === currentPath);
  
  if (!service) return { title: 'Service Not Found | Saampark Group' };

  const fullUrl = `https://www.saampark.com${currentPath}`;
  const keywords = [
    service.name,
    'Saampark Group',
    'Saampark Technology',
    'Saampark Consultancy',
    `${service.name} India`,
    `${service.name} West Bengal`,
    'web development',
    'mobile app development',
    'digital marketing',
  ];
  
  return {
    title: `${service.name} | Saampark Group Services`,
    description: service.description,
    keywords,
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: `${service.name} — ISO Certified Saampark Group`,
      description: service.description,
      url: fullUrl,
      siteName: 'Saampark Group',
      type: 'article',
      images: [
        {
          url: '/assets/logos/logo-main.png',
          alt: service.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} | Saampark Group`,
      description: service.description,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const resolvedParams = await params;
  const currentPath = `/${resolvedParams.entity}/${resolvedParams.category}/${resolvedParams.slug}`;
  const service = allServices.find(s => s.href === currentPath);

  if (!service) {
    notFound();
  }

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 28px)' }}>
      <ServiceDetail service={service} />
    </div>
  );
}
