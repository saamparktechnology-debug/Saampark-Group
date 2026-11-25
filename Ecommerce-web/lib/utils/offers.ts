export interface StorefrontOffer {
  id: string;
  code: string;
  percent: number;
  title: string;
  description: string;
  scope: 'tech' | 'consultancy';
  validUntil?: string;
  ctaLink?: string;
  image?: string;
}

export const DEFAULT_TECH_OFFERS: StorefrontOffer[] = [
  {
    id: 'default-diwali25',
    code: 'DIWALI25',
    percent: 25,
    title: 'Diwali Digital Booster Pack',
    description: 'FLAT 25% DISCOUNT ON CUSTOM CRM & ERP SYSTEMS',
    scope: 'tech',
    validUntil: '2026-12-31',
    ctaLink: '/#marketplace-catalog',
  },
  {
    id: 'default-tech20',
    code: 'TECH20',
    percent: 20,
    title: 'Web & App Launch Offer',
    description: 'FLAT 20% OFF on Website & Mobile App Development packages',
    scope: 'tech',
    validUntil: '2026-12-31',
    ctaLink: '/#marketplace-catalog',
  },
];

export const DEFAULT_CONSULTANCY_OFFERS: StorefrontOffer[] = [
  {
    id: 'default-startup30',
    code: 'STARTUP30',
    percent: 30,
    title: 'Startup Legal Onboarding Bundle',
    description: '30% OFF Trademark + GST + Company Registration Services',
    scope: 'consultancy',
    validUntil: '2026-12-31',
    ctaLink: '/#marketplace-catalog',
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
  const seenCodes = new Set<string>();

  const pushOffer = (offer: StorefrontOffer) => {
    const code = offer.code.trim().toUpperCase();
    if (!code || offer.percent <= 0 || seenCodes.has(code)) return;
    seenCodes.add(code);
    results.push({ ...offer, code });
  };

  (['tech', 'consultancy'] as const).forEach((scope) => {
    const cfg = storefront?.[scope];
    if (cfg) {
      const banners = Array.isArray(cfg.discountBanners) ? cfg.discountBanners : [];
      banners.forEach((b: any, idx: number) => {
        if (b?.isActive !== false && b?.promoCode) {
          const pct =
            Number(b.discountPercentage) ||
            parsePercentFromText(b.discountText) ||
            20;
          pushOffer({
            id: b.id || `${scope}-banner-${idx}`,
            code: String(b.promoCode),
            percent: pct,
            title: b.title || 'Official Storefront Offer',
            description: b.discountText || `Get ${pct}% OFF with code ${b.promoCode}`,
            scope,
            validUntil: b.validUntil,
            ctaLink: b.ctaLink && String(b.ctaLink).startsWith('/') ? b.ctaLink : '/#marketplace-catalog',
            image: b.image,
          });
        }
      });

      if (cfg.promoRibbon?.enabled && cfg.promoRibbon?.highlightText) {
        const ribbonCodeMatch = String(cfg.promoRibbon.highlightText).match(/([A-Z0-9]{4,16})/);
        if (ribbonCodeMatch) {
          const ribbonCode = ribbonCodeMatch[1];
          const pct = parsePercentFromText(cfg.promoRibbon.text) || FALLBACK_COUPON_PERCENTAGES[ribbonCode] || 20;
          pushOffer({
            id: `${scope}-ribbon`,
            code: ribbonCode,
            percent: pct,
            title: cfg.promoRibbon.badge || 'Limited Offer',
            description: cfg.promoRibbon.text || `Save ${pct}% using promo code ${ribbonCode}`,
            scope,
            ctaLink: cfg.promoRibbon.link && String(cfg.promoRibbon.link).startsWith('/') ? cfg.promoRibbon.link : '/#marketplace-catalog',
          });
        }
      }
    } else {
      const defaults = scope === 'tech' ? DEFAULT_TECH_OFFERS : DEFAULT_CONSULTANCY_OFFERS;
      defaults.forEach(pushOffer);
    }
  });

  if (results.length === 0) {
    [...DEFAULT_TECH_OFFERS, ...DEFAULT_CONSULTANCY_OFFERS].forEach(pushOffer);
  }

  return results;
}
