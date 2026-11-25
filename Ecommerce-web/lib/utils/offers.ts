export interface StorefrontOffer {
  id: string;
  code: string;
  percent: number;
  title: string;
  badge?: string;
  description: string;
  scope: 'tech' | 'consultancy';
  showInCheckout: boolean;
  validUntil?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
}

export const DEFAULT_TECH_OFFERS: StorefrontOffer[] = [
  {
    id: 'default-diwali25',
    code: 'DIWALI25',
    percent: 25,
    title: 'Diwali Digital Booster Pack',
    badge: '25% OFF Voucher',
    description: 'FLAT 25% DISCOUNT ON CUSTOM CRM & ERP SYSTEMS',
    scope: 'tech',
    showInCheckout: false,
    validUntil: '2026-12-31',
    ctaText: 'Claim Offer',
    ctaLink: '/#marketplace-catalog',
    image: '/assets/images/one-page-web.jpg',
  },
];

export const DEFAULT_CONSULTANCY_OFFERS: StorefrontOffer[] = [
  {
    id: 'default-startup30',
    code: 'STARTUP30',
    percent: 30,
    title: 'Startup Legal Onboarding Bundle',
    badge: '30% OFF Voucher',
    description: '30% OFF Trademark + GST + Company Registration Services',
    scope: 'consultancy',
    showInCheckout: false,
    validUntil: '2026-12-31',
    ctaText: 'Claim Offer',
    ctaLink: '/#marketplace-catalog',
    image: '/assets/images/pvtltd-reg.jpg',
  },
];

export const FALLBACK_COUPON_PERCENTAGES: Record<string, number> = {
  DIWALI25: 25,
  STARTUP30: 30,
  TECH20: 20,
  SAAMPARK10: 10,
};

function parsePercentFromText(text?: string): number | null {
  if (!text) return null;
  const match = String(text).match(/(\d{1,2})\s*%/);
  return match ? Number(match[1]) : null;
}

export function extractStorefrontOffers(storefront: any): StorefrontOffer[] {
  const results: StorefrontOffer[] = [];
  const seenIds = new Set<string>();

  const pushOffer = (offer: StorefrontOffer) => {
    const id = offer.id || offer.code || offer.title;
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    results.push({
      ...offer,
      code: (offer.code || '').trim().toUpperCase(),
    });
  };

  (['tech', 'consultancy'] as const).forEach((scope) => {
    const cfg = storefront?.[scope];
    if (cfg && Array.isArray(cfg.discountBanners)) {
      cfg.discountBanners.forEach((b: any, idx: number) => {
        if (b?.isActive !== false && b?.title) {
          const pct =
            Number(b.discountPercentage) ||
            parsePercentFromText(b.discountText) ||
            0;
          pushOffer({
            id: b.id || `${scope}-banner-${idx}`,
            code: String(b.promoCode || ''),
            percent: pct,
            title: b.title || 'Official Storefront Offer',
            badge: b.badge || (pct > 0 ? `${pct}% OFF Voucher` : 'Featured Offer'),
            description: b.discountText || (b.promoCode ? `Get ${pct}% OFF with code ${b.promoCode}` : ''),
            scope,
            showInCheckout: !!b.showInCheckout,
            validUntil: b.validUntil,
            ctaText: b.ctaText || 'Claim Offer',
            ctaLink: b.ctaLink && String(b.ctaLink).startsWith('/') ? b.ctaLink : '/#marketplace-catalog',
            image: b.image,
          });
        }
      });
    } else if (!cfg) {
      const defaults = scope === 'tech' ? DEFAULT_TECH_OFFERS : DEFAULT_CONSULTANCY_OFFERS;
      defaults.forEach(pushOffer);
    }
  });

  return results;
}
