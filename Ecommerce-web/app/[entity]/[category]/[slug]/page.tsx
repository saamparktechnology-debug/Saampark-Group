import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { allServices, type Service } from '@/lib/data/services';
import { ServiceDetail } from '@/components/features/ServiceDetail/ServiceDetail';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    entity: string;
    category: string;
    slug: string;
  }>;
}

const CRM_CATALOG_URL =
  process.env.CRM_CATALOG_API ||
  'http://187.124.132.7:5005/api/v1/store/public/catalog';

async function resolveServiceByRoute(entity: string, category: string, slug: string): Promise<Service | null> {
  const currentPath = `/${entity}/${category}/${slug}`;
  const staticMatch =
    allServices.find((s) => s.href === currentPath) ||
    allServices.find((s) => s.slug === slug);

  try {
    const res = await fetch(CRM_CATALOG_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = await res.json();
      const techList = Array.isArray(json?.data?.products?.tech) ? json.data.products.tech : [];
      const consultList = Array.isArray(json?.data?.products?.consultancy) ? json.data.products.consultancy : [];
      const allCrm = [...techList, ...consultList];

      const crmMatch =
        allCrm.find((p: any) => p.href === currentPath) ||
        allCrm.find((p: any) => p.slug === slug);

      if (crmMatch) {
        const groupNorm =
          crmMatch.companyId === 'consultancy' || crmMatch.group === 'consultancy'
            ? 'consultancy'
            : 'technology';
        const hasDiscount =
          typeof crmMatch.discountPrice === 'number' &&
          crmMatch.discountPrice > 0 &&
          crmMatch.startingPrice > crmMatch.discountPrice;

        return {
          ...(staticMatch || {}),
          id: crmMatch.id || staticMatch?.id || crmMatch.slug,
          name: crmMatch.name || staticMatch?.name || 'Saampark Service',
          shortName: crmMatch.shortName || staticMatch?.shortName || crmMatch.name,
          slug: crmMatch.slug || staticMatch?.slug || slug,
          group: groupNorm,
          entity: crmMatch.entity || staticMatch?.entity || (groupNorm === 'consultancy' ? 'scs' : 'str'),
          primaryCategory: crmMatch.primaryCategory || staticMatch?.primaryCategory || 'web-services',
          category: crmMatch.category || staticMatch?.category || 'website',
          sector: crmMatch.sector || staticMatch?.sector || category,
          startingPrice: hasDiscount
            ? crmMatch.discountPrice
            : (crmMatch.startingPrice ?? staticMatch?.startingPrice ?? null),
          originalPrice: hasDiscount ? crmMatch.startingPrice : null,
          discountPrice: crmMatch.discountPrice ?? null,
          priceType: crmMatch.priceType || staticMatch?.priceType || 'one-time',
          deliveryDays:
            typeof crmMatch.deliveryDays === 'number'
              ? crmMatch.deliveryDays
              : parseInt(String(crmMatch.deliveryDays || staticMatch?.deliveryDays || '5'), 10) || 5,
          badge: crmMatch.badge !== undefined ? crmMatch.badge : staticMatch?.badge,
          isPopular: crmMatch.isPopular ?? staticMatch?.isPopular ?? false,
          isFeatured: crmMatch.isFeatured ?? staticMatch?.isFeatured ?? false,
          color: crmMatch.color || staticMatch?.color || '#2563EB',
          icon: crmMatch.icon || staticMatch?.icon || 'Globe',
          href: crmMatch.href || staticMatch?.href || currentPath,
          image: crmMatch.image || staticMatch?.image,
          galleryImages: Array.isArray(crmMatch.galleryImages)
            ? crmMatch.galleryImages.filter((u: string) => Boolean(u && u.trim()))
            : [],
          technologiesUsed: Array.isArray(crmMatch.technologiesUsed) ? crmMatch.technologiesUsed : undefined,
          faqs: Array.isArray(crmMatch.faqs) ? crmMatch.faqs : undefined,
          description: crmMatch.description || staticMatch?.description || '',
          features:
            Array.isArray(crmMatch.features) && crmMatch.features.length > 0
              ? crmMatch.features
              : staticMatch?.features || [],
          notIncluded:
            Array.isArray(crmMatch.notIncluded)
              ? crmMatch.notIncluded
              : staticMatch?.notIncluded,
        } as Service;
      }
    }
  } catch {
    // Silent fallback to static catalog
  }

  return staticMatch || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const service = await resolveServiceByRoute(resolvedParams.entity, resolvedParams.category, resolvedParams.slug);

  if (!service) return { title: 'Service Not Found | Saampark Group' };

  const currentPath = `/${resolvedParams.entity}/${resolvedParams.category}/${resolvedParams.slug}`;
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
          url: service.image || '/assets/logos/logo-main-v2.png',
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
  const service = await resolveServiceByRoute(
    resolvedParams.entity,
    resolvedParams.category,
    resolvedParams.slug
  );

  if (!service) {
    notFound();
  }

  return (
    <div style={{ paddingTop: 'calc(var(--nav-height, 72px) + 18px)' }}>
      <ServiceDetail service={service} />
    </div>
  );
}
