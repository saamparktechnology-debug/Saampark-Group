import {
  allServices,
  SERVICE_CATEGORIES,
  SERVICE_GROUPS,
  type Service,
  type CategoryMetadata,
} from '@/lib/data/services';
import type { StorefrontOffer } from '@/lib/utils/offers';

export type SearchItemType = 'service' | 'category' | 'offer' | 'page' | 'faq' | 'action';

export interface SearchSuggestion {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle: string;
  badge: string;
  href?: string;
  action?: 'open-cart' | 'open-wishlist' | 'open-compare' | 'open-track' | 'copy-promo';
  promoCode?: string;
  keywords: string[];
  priceLabel?: string;
}

const STATIC_PAGES_AND_TOOLS: SearchSuggestion[] = [
  {
    id: 'page-home-catalog',
    type: 'page',
    title: 'All Digital & Consultancy Services Catalog',
    subtitle: 'Browse complete websites, mobile apps, AI automation, digital marketing & legal packages',
    badge: 'Catalog',
    href: '/#marketplace-catalog',
    keywords: ['catalog', 'services', 'products', 'all services', 'browse', 'solutions', 'store', 'pricing'],
  },
  {
    id: 'page-technology',
    type: 'page',
    title: 'Saampark Technology Division (STR)',
    subtitle: 'Websites, mobile apps, custom ERP/CRM software, AI chatbots, hosting & AMC',
    badge: 'Technology',
    href: '/?group=technology#marketplace-catalog',
    keywords: ['str', 'saampark technology', 'tech', 'software', 'web', 'app', 'ai', 'erp', 'crm'],
  },
  {
    id: 'page-consultancy',
    type: 'page',
    title: 'Saampark Consultancy Division (SCS)',
    subtitle: 'Meta & Google Ads, 4K AI videos, graphic design, Pvt Ltd & GST legal setup',
    badge: 'Consultancy',
    href: '/?group=consultancy#marketplace-catalog',
    keywords: ['scs', 'saampark consultancy', 'marketing', 'ads', 'legal', 'gst', 'pvt ltd', 'video'],
  },
  {
    id: 'page-estimator',
    type: 'page',
    title: 'Instant Project Cost & Timeline Estimator',
    subtitle: 'Calculate custom website, app or ERP budget and sprint delivery timeline in real-time',
    badge: 'Tool',
    href: '/#instant-estimator',
    keywords: ['estimator', 'cost calculator', 'budget', 'quote', 'price calculator', 'timeline', 'estimate'],
  },
  {
    id: 'page-about',
    type: 'page',
    title: 'About Saampark Group & ISO 9001:2015 Verification',
    subtitle: 'Company overview, CIN & ISO certification verification, divisions & leadership',
    badge: 'Company',
    href: '/about',
    keywords: ['about', 'company', 'iso', '9001', 'certified', 'registration', 'verification', 'saampark group'],
  },
  {
    id: 'page-contact',
    type: 'page',
    title: 'Contact Support, Office Address & WhatsApp Helpdesk',
    subtitle: 'Reach STR Engineering & SCS Consultancy teams or request a bespoke consultation',
    badge: 'Support',
    href: '/contact',
    keywords: ['contact', 'support', 'whatsapp', 'phone', 'email', 'office', 'address', 'help', 'consultation'],
  },
  {
    id: 'page-track',
    type: 'action',
    title: 'Track Live Order Status & Download Invoices',
    subtitle: 'Check real-time milestone status using Order ID or email address',
    badge: 'Orders',
    href: '/track',
    action: 'open-track',
    keywords: ['track', 'order status', 'invoice', 'gst invoice', 'receipt', 'milestone', 'delivery status'],
  },
  {
    id: 'page-account',
    type: 'page',
    title: 'My Account, Order History & Billing Portal',
    subtitle: 'Sign in with email to view saved billing details, order history and invoices',
    badge: 'Account',
    href: '/account',
    keywords: ['account', 'login', 'profile', 'billing', 'order history', 'sign in', 'register'],
  },
  {
    id: 'action-cart',
    type: 'action',
    title: 'Open Shopping Cart & GST Checkout',
    subtitle: 'Review selected services, apply promo coupons and complete GST order checkout',
    badge: 'Cart',
    action: 'open-cart',
    keywords: ['cart', 'checkout', 'buy', 'bag', 'coupon', 'promo', 'payment', 'gst'],
  },
  {
    id: 'action-compare',
    type: 'action',
    title: 'Compare Services Side-by-Side',
    subtitle: 'Open the interactive comparison tray to compare features, prices and delivery SLA',
    badge: 'Compare',
    action: 'open-compare',
    keywords: ['compare', 'comparison', 'difference', 'vs', 'specifications', 'sla'],
  },
  {
    id: 'action-wishlist',
    type: 'action',
    title: 'Open Saved Wishlist Services',
    subtitle: 'View packages bookmarked for quick ordering later',
    badge: 'Wishlist',
    action: 'open-wishlist',
    keywords: ['wishlist', 'saved', 'bookmark', 'favorites'],
  },
  {
    id: 'faq-ip-ownership',
    type: 'faq',
    title: 'FAQ: 100% Full Source Code & IP Rights Ownership',
    subtitle: 'Yes — all websites, apps and custom software include full IP & source code transfer',
    badge: 'FAQ',
    href: '/#faqHeading',
    keywords: ['source code', 'ip', 'ownership', 'intellectual property', 'vendor lock-in', 'rights', 'faq'],
  },
  {
    id: 'faq-delivery-sla',
    type: 'faq',
    title: 'FAQ: Fast 3–12 Day Delivery SLA & Live Staging Previews',
    subtitle: 'Standard websites ship in 3–5 days, apps in 7–12 days with live staging URL',
    badge: 'FAQ',
    href: '/#faqHeading',
    keywords: ['delivery', 'sla', 'how fast', 'days', 'timeline', 'staging', 'faq'],
  },
  {
    id: 'faq-warranty-support',
    type: 'faq',
    title: 'FAQ: Post-Launch Warranty, SSL & 24/7 Maintenance Support',
    subtitle: 'Free warranty bug-fix support, SSL certification and server backups included',
    badge: 'FAQ',
    href: '/#faqHeading',
    keywords: ['maintenance', 'warranty', 'ssl', 'hosting', 'bug fix', 'backup', 'faq'],
  },
];

function formatSearchPrice(price: number | null, priceType: string): string {
  if (!price) return 'Custom Quote';
  const suffix = priceType === 'monthly' ? '/mo' : priceType === 'weekly' ? '/wk' : '';
  return `₹${price.toLocaleString('en-IN')}${suffix}`;
}

export function serviceMatchesQuery(svc: Service, rawQuery: string, categoryName?: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);
  const haystack = [
    svc.name,
    svc.shortName,
    svc.description,
    svc.group,
    svc.entity,
    svc.primaryCategory,
    categoryName || '',
    svc.sector,
    svc.badge || '',
    svc.slug,
    svc.startingPrice ? String(svc.startingPrice) : '',
    ...(svc.features || []),
    ...(svc.notIncluded || []),
    ...(svc.technologiesUsed || []),
  ]
    .join(' ')
    .toLowerCase();

  return terms.every((t) => haystack.includes(t));
}

export function buildLiveSearchResults(
  rawQuery: string,
  opts?: {
    services?: Service[];
    categories?: CategoryMetadata[];
    offers?: StorefrontOffer[];
  }
): SearchSuggestion[] {
  const q = rawQuery.trim().toLowerCase();
  const services = opts?.services && opts.services.length > 0 ? opts.services : allServices;
  const categories = opts?.categories && opts.categories.length > 0 ? opts.categories : SERVICE_CATEGORIES;
  const offers = opts?.offers || [];

  const catNameMap = new Map(categories.map((c) => [c.id, c.name]));

  if (!q) {
    // Popular curated quick suggestions when search input is focused empty
    const topServices: SearchSuggestion[] = services.slice(0, 4).map((svc) => ({
      id: `svc-${svc.id}`,
      type: 'service',
      title: svc.name,
      subtitle: svc.description,
      badge: catNameMap.get(svc.primaryCategory) || svc.group.toUpperCase(),
      href: svc.href,
      keywords: [svc.name],
      priceLabel: formatSearchPrice(svc.startingPrice, svc.priceType),
    }));
    return [...topServices, ...STATIC_PAGES_AND_TOOLS.slice(0, 4)];
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const scored: Array<{ item: SearchSuggestion; score: number }> = [];

  const scoreMatch = (primaryText: string, secondaryText: string, allKeywords: string[]) => {
    const p = primaryText.toLowerCase();
    const s = secondaryText.toLowerCase();
    const joined = `${p} ${s} ${allKeywords.join(' ').toLowerCase()}`;
    if (!terms.every((t) => joined.includes(t))) return -1;

    let score = 10;
    if (p === q) score += 100;
    else if (p.startsWith(q)) score += 65;
    else if (p.includes(q)) score += 45;
    if (s.includes(q)) score += 15;
    return score;
  };

  // 1. Live & Registry Services
  for (const svc of services) {
    const catName = catNameMap.get(svc.primaryCategory) || svc.primaryCategory;
    const kw = [
      svc.shortName,
      svc.group,
      svc.entity,
      svc.primaryCategory,
      catName,
      svc.sector,
      svc.badge || '',
      svc.slug,
      svc.startingPrice ? String(svc.startingPrice) : '',
      ...(svc.features || []),
      ...(svc.technologiesUsed || []),
    ];
    const sc = scoreMatch(svc.name, svc.description, kw);
    if (sc > 0) {
      scored.push({
        score: sc + (svc.isPopular ? 8 : 0),
        item: {
          id: `svc-${svc.id}`,
          type: 'service',
          title: svc.name,
          subtitle: svc.description,
          badge: catName,
          href: svc.href,
          keywords: kw,
          priceLabel: formatSearchPrice(svc.startingPrice, svc.priceType),
        },
      });
    }
  }

  // 2. Categories & Divisions
  for (const cat of categories) {
    const grp = SERVICE_GROUPS.find((g) => g.id === cat.group)?.name || cat.group;
    const kw = [cat.id, cat.group, grp];
    const sc = scoreMatch(cat.name, `Browse all ${cat.name} packages in ${grp}`, kw);
    if (sc > 0) {
      scored.push({
        score: sc + 12,
        item: {
          id: `cat-${cat.id}`,
          type: 'category',
          title: cat.name,
          subtitle: `Filter catalog by ${cat.name} (${grp})`,
          badge: 'Category',
          href: `/?group=${cat.group}&category=${encodeURIComponent(cat.id)}#marketplace-catalog`,
          keywords: kw,
        },
      });
    }
  }

  // 3. Active Storefront Offer Banners & Promo Codes
  for (const off of offers) {
    const kw = [off.code, `${off.percent}%`, off.scope, off.badge || ''];
    const sc = scoreMatch(
      `${off.title}${off.code ? ` (${off.code})` : ''}`,
      off.description,
      kw
    );
    if (sc > 0) {
      scored.push({
        score: sc + 18,
        item: {
          id: `offer-${off.id}`,
          type: 'offer',
          title: off.code ? `${off.title} — Code: ${off.code}` : off.title,
          subtitle: off.description,
          badge: off.percent > 0 ? `${off.percent}% OFF` : 'Offer',
          href: off.ctaLink || '/#marketplace-catalog',
          promoCode: off.code || undefined,
          keywords: kw,
        },
      });
    }
  }

  // 4. Website Pages, Tools, Actions & FAQs
  for (const entry of STATIC_PAGES_AND_TOOLS) {
    const sc = scoreMatch(entry.title, entry.subtitle, entry.keywords);
    if (sc > 0) {
      scored.push({ score: sc, item: entry });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 10).map((s) => s.item);
}
