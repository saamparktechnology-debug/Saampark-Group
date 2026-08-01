import type { Metadata } from 'next';
import { MarketplaceHome } from '@/components/features/MarketplaceHome/MarketplaceHome';
import { PromoRibbon }      from '@/components/sections/PromoRibbon/PromoRibbon';

export const metadata: Metadata = {
  title: 'Saampark Storefront | Buy Web Development, Marketing & Legal Services Online',
  description:
    'Order ISO 9001:2015 certified services directly from our store: websites, mobile apps, custom software, ERP, Meta Ads campaigns, and company registration. Upfront pricing, clear timelines.',
  alternates: { canonical: 'https://www.saampark.com' },
};

export default function HomePage() {
  return (
    <div style={{ paddingTop: 'calc(var(--nav-height) + 28px)' }}>
      <PromoRibbon />
      <div style={{ paddingTop: 'var(--size-2)' }}>
        <MarketplaceHome />
      </div>
    </div>
  );
}
