# 09 — Marketplace

> The Marketplace is a unified package explorer where visitors can browse, filter, and compare all offerings from both STR and SCS under one roof.

---

## Marketplace Goal

Enable a self-service discovery experience where any business owner can:
1. **Browse** all available services and packages
2. **Filter** by entity, category, budget, and type
3. **Compare** packages side-by-side
4. **Inquire** or get a quote directly from a package card

---

## URL Structure

```
/marketplace                  → All packages (default: featured)
/marketplace?entity=str       → STR only
/marketplace?entity=scs       → SCS only
/marketplace?category=website → Website packages
/marketplace?budget=under-5000 → Budget filter
/marketplace/web-development   → Category landing
/marketplace/app-development
/marketplace/digital-marketing
/marketplace/ads-management
/marketplace/video-ai
/marketplace/business-legal
```

---

## Filter System

### Filter Dimensions

#### 1. Entity (Radio)
- [ ] All Services
- [ ] Technology (STR)
- [ ] Consultancy (SCS)

#### 2. Category (Multi-select Checkboxes)
**STR Categories:**
- Website Development
- App Development
- Software Solutions
- Specialized Websites

**SCS Categories:**
- Social Media Management
- Meta Ads
- Google Ads
- Google Business Profile
- Business & Legal
- Video & AI Services

#### 3. Budget (Slider / Range)
- Under ₹2,000
- ₹2,000 – ₹5,000
- ₹5,000 – ₹15,000
- ₹15,000 – ₹30,000
- ₹30,000+
- On Request

#### 4. Delivery Time (Radio)
- Under 1 week
- 1–2 weeks
- 2–4 weeks
- 1 month+
- Ongoing (subscription)

#### 5. Sort By (Dropdown)
- Featured (default)
- Price: Low to High
- Price: High to Low
- Most Popular
- Newest

---

## Marketplace Layout

### Desktop (1280px+)
```
┌─────────────────────────────────────────────────────────┐
│  [Header + Search Bar]                                  │
├─────────────┬───────────────────────────────────────────┤
│             │  [Filter chips: Quick filters]            │
│  Filter     │                                           │
│  Sidebar    │  [Result count: "32 packages found"]      │
│  (280px)    │                                           │
│             │  [Package Grid — 3 columns]               │
│  - Entity   │                                           │
│  - Category │  [Card] [Card] [Card]                     │
│  - Budget   │  [Card] [Card] [Card]                     │
│  - Time     │  [Card] [Card] [Card]                     │
│             │                                           │
│  [Reset]    │  [Load More / Pagination]                 │
└─────────────┴───────────────────────────────────────────┘
```

### Mobile (< 768px)
```
[Search Bar]
[Filter Button → Bottom Sheet]
[Horizontal scrollable category pills]
[Package Cards — 1 column]
[Load More]
```

---

## Package Card Component

### Card Structure

```
┌─────────────────────────────────┐
│  [Entity Badge: STR | SCS]      │
│  [Category Icon]  [Popular ⭐]  │
│                                 │
│  Package Name                   │
│  Short description (2 lines)    │
│                                 │
│  ✓ Feature 1                   │
│  ✓ Feature 2                   │
│  ✓ Feature 3                   │
│                                 │
│  ──────────────────────────── │
│  Starting at                    │
│  ₹X,XXX                        │
│                                 │
│  [Get Quote]  [Learn More →]   │
└─────────────────────────────────┘
```

### Card Variants

| State | Visual |
|-------|--------|
| Default | White card, subtle shadow |
| Hover | Lifted shadow, teal top-border |
| Featured | Teal gradient border, "Most Popular" badge |
| Sold Out | Greyed out, "Coming Soon" badge |

### Card Data Shape

```ts
interface Package {
  id: string;
  entity: 'str' | 'scs';
  category: PackageCategory;
  name: string;
  description: string;
  features: string[];
  startingPrice: number | null;   // null = "on request"
  priceType: 'one-time' | 'monthly' | 'weekly' | 'on-request';
  deliveryDays: number | null;
  isPopular: boolean;
  isFeatured: boolean;
  badge?: string;                 // e.g. "⭐ Offer"
  slug: string;
  detailPageUrl: string;
}
```

---

## Complete Package Catalog

### STR Packages

```ts
const strPackages: Package[] = [
  {
    id: 'str-web-onepage',
    entity: 'str',
    category: 'website',
    name: 'One Page Website',
    description: 'Perfect for personal brands, portfolios, and small businesses.',
    features: ['Personal / Portfolio / Business', 'Mobile Responsive', 'Basic SEO', 'Contact Form'],
    startingPrice: 1999,
    priceType: 'one-time',
    deliveryDays: 5,
    isPopular: false,
    isFeatured: true,
    badge: '⚡ Offer',
    slug: 'one-page-website',
    detailPageUrl: '/technology/web-development/one-page-website',
  },
  {
    id: 'str-web-static',
    entity: 'str',
    category: 'website',
    name: 'Static Website',
    description: 'A professional multi-page website for your company profile.',
    features: ['Up to 5 Pages', 'Custom Design', 'Mobile Responsive', 'Google Analytics', 'Basic SEO'],
    startingPrice: 3999,
    priceType: 'one-time',
    deliveryDays: 7,
    isPopular: true,
    isFeatured: true,
    slug: 'static-website',
    detailPageUrl: '/technology/web-development/static-website',
  },
  {
    id: 'str-web-dynamic',
    entity: 'str',
    category: 'website',
    name: 'Dynamic Website',
    description: 'Full-featured website with admin panel, database, and user management.',
    features: ['Admin Panel', 'Database Integration', 'User Login', 'Management System', 'Advanced SEO'],
    startingPrice: 11999,
    priceType: 'one-time',
    deliveryDays: 15,
    isPopular: true,
    isFeatured: true,
    slug: 'dynamic-website',
    detailPageUrl: '/technology/web-development/dynamic-website',
  },
  {
    id: 'str-web-ecommerce',
    entity: 'str',
    category: 'website',
    name: 'E-Commerce Website',
    description: 'Sell online with a complete store, payment gateway, and order management.',
    features: ['Online Store', 'Payment Gateway', 'Customer Login', 'Order Management', 'Product Management'],
    startingPrice: 21999,
    priceType: 'one-time',
    deliveryDays: 25,
    isPopular: false,
    isFeatured: true,
    slug: 'ecommerce-website',
    detailPageUrl: '/technology/web-development/ecommerce-website',
  },
  // App Development — on request
  {
    id: 'str-app-android',
    entity: 'str',
    category: 'app',
    name: 'Android App Development',
    description: 'Native Android app built with Kotlin/Java for your business needs.',
    features: ['Native Android', 'Custom UI/UX', 'API Integration', 'Play Store Publishing', 'Free Support 30 Days'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    slug: 'android-app',
    detailPageUrl: '/technology/app-development/android',
  },
  {
    id: 'str-app-ios',
    entity: 'str',
    category: 'app',
    name: 'iOS App Development',
    description: 'Native iOS app built with Swift for iPhone and iPad.',
    features: ['Native iOS', 'Custom UI/UX', 'API Integration', 'App Store Publishing', 'Free Support 30 Days'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: false,
    isFeatured: false,
    slug: 'ios-app',
    detailPageUrl: '/technology/app-development/ios',
  },
  {
    id: 'str-app-hybrid',
    entity: 'str',
    category: 'app',
    name: 'Hybrid Mobile App',
    description: 'Cross-platform app (Flutter/React Native) for Android & iOS from a single codebase.',
    features: ['Android + iOS', 'Flutter / React Native', 'Cost Effective', 'API Integration', 'Both Store Publishing'],
    startingPrice: null,
    priceType: 'on-request',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    slug: 'hybrid-app',
    detailPageUrl: '/technology/app-development/hybrid',
  },
];
```

### SCS Packages

```ts
const scsPackages: Package[] = [
  {
    id: 'scs-social-standard',
    entity: 'scs',
    category: 'social-media',
    name: 'Social Media Page Control',
    description: 'Let SCS manage your social media presence professionally.',
    features: ['4 Business Posters/Month', 'Wish Day Poster FREE', 'Facebook + Instagram', 'Content Scheduling'],
    startingPrice: 499,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '🔥 Most Affordable',
    slug: 'social-media-management',
    detailPageUrl: '/consultancy/digital-marketing/social-media',
  },
  {
    id: 'scs-meta-weekly',
    entity: 'scs',
    category: 'meta-ads',
    name: 'Meta Ads — Weekly',
    description: 'Short-burst Facebook & Instagram advertising campaign.',
    features: ['Wish Day Poster', 'Facebook + Instagram Ads', 'Audience Targeting', 'Campaign Report'],
    startingPrice: 600,
    priceType: 'weekly',
    deliveryDays: 7,
    isPopular: false,
    isFeatured: false,
    slug: 'meta-ads-weekly',
    detailPageUrl: '/consultancy/ads-management/meta-ads',
  },
  {
    id: 'scs-meta-monthly',
    entity: 'scs',
    category: 'meta-ads',
    name: 'Meta Ads — Monthly',
    description: 'Full-month managed Meta advertising campaign.',
    features: ['Wish Day Poster', 'Facebook + Instagram Ads', 'Monthly Optimization', 'Performance Report'],
    startingPrice: 2000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    slug: 'meta-ads-monthly',
    detailPageUrl: '/consultancy/ads-management/meta-ads',
  },
  {
    id: 'scs-meta-premium',
    entity: 'scs',
    category: 'meta-ads',
    name: 'Meta Ads — Premium',
    description: 'The complete Meta advertising solution with videos, reels, and 1M impressions.',
    features: ['2 AI Videos', '4 Reels ⭐', '1 Ad Poster', '20 Business Posters', 'Wish Day FREE', '1M Ad Impressions'],
    startingPrice: 9499,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    badge: '⭐ Best Value',
    slug: 'meta-ads-premium',
    detailPageUrl: '/consultancy/ads-management/meta-ads',
  },
  {
    id: 'scs-google-weekly',
    entity: 'scs',
    category: 'google-ads',
    name: 'Google Ads — Weekly',
    description: 'Quick Google Search campaign to capture immediate leads.',
    features: ['Google Search Ads', 'Keyword Targeting', 'Basic Setup', 'Campaign Report'],
    startingPrice: 1000,
    priceType: 'weekly',
    deliveryDays: 7,
    isPopular: false,
    isFeatured: false,
    slug: 'google-ads-weekly',
    detailPageUrl: '/consultancy/ads-management/google-ads',
  },
  {
    id: 'scs-google-monthly',
    entity: 'scs',
    category: 'google-ads',
    name: 'Google Ads — Monthly',
    description: 'Full-month managed Google advertising campaign.',
    features: ['Google Search + Display', 'Monthly Optimization', 'Conversion Tracking', 'Performance Report'],
    startingPrice: 3500,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: true,
    isFeatured: true,
    slug: 'google-ads-monthly',
    detailPageUrl: '/consultancy/ads-management/google-ads',
  },
  {
    id: 'scs-google-premium',
    entity: 'scs',
    category: 'google-ads',
    name: 'Google Ads — Premium',
    description: 'Maximum Google advertising impact with videos, content and 1M impressions.',
    features: ['2 AI Videos', '4 Reels ⭐', '1 Ad Poster', 'Professional Fees', '1M Google Impressions'],
    startingPrice: 19999,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: false,
    isFeatured: true,
    badge: '💎 Premium',
    slug: 'google-ads-premium',
    detailPageUrl: '/consultancy/ads-management/google-ads',
  },
  {
    id: 'scs-gbp-basic',
    entity: 'scs',
    category: 'google-business',
    name: 'GBP — Basic Management',
    description: 'Setup and basic management of your Google Business Profile.',
    features: ['GBP Setup', 'Verification Support', 'Product Listing', 'Weekly Updates'],
    startingPrice: 1000,
    priceType: 'monthly',
    deliveryDays: null,
    isPopular: false,
    isFeatured: false,
    slug: 'gbp-basic',
    detailPageUrl: '/consultancy/digital-marketing/google-business-profile',
  },
  {
    id: 'scs-video-simple',
    entity: 'scs',
    category: 'video-ai',
    name: 'Simple Video',
    description: 'Quick, clean video for your business announcements.',
    features: ['Slideshow / Text Animation', 'Background Music', 'HD Quality', 'Fast Delivery'],
    startingPrice: 499,
    priceType: 'one-time',
    deliveryDays: 2,
    isPopular: false,
    isFeatured: false,
    slug: 'simple-video',
    detailPageUrl: '/consultancy/video-ai/simple-video',
  },
  {
    id: 'scs-video-full-ai',
    entity: 'scs',
    category: 'video-ai',
    name: 'Full AI Video',
    description: 'Completely AI-generated video with voice, script, and professional editing.',
    features: ['AI Voice & Script', 'AI-Generated Visuals', 'Professional Editing', 'Background Music', 'Fast Delivery'],
    startingPrice: 1499,
    priceType: 'one-time',
    deliveryDays: 3,
    isPopular: true,
    isFeatured: true,
    badge: '🤖 AI-Powered',
    slug: 'full-ai-video',
    detailPageUrl: '/consultancy/video-ai/full-ai-video',
  },
];
```

---

## Compare Feature

Users can select up to 3 packages and compare them side-by-side in a modal or dedicated compare page.

### Compare Modal Layout
```
         Package A        Package B        Package C
Price    ₹X,XXX/mo       ₹X,XXX/mo       ₹X,XXX
Feature1   ✅               ✅               ❌
Feature2   ✅               ❌               ✅
Feature3   ❌               ✅               ✅
[Select]  [Get Quote]     [Get Quote]     [Get Quote]
```

---

## Marketplace Page SEO

```ts
export const metadata = {
  title: 'Marketplace — All Services & Packages | Saampark Group',
  description: 'Explore all web development, app development, digital marketing, Google Ads, Meta Ads, video, and legal service packages from Saampark Group. Transparent pricing starting at ₹499.',
  keywords: ['website packages India', 'digital marketing packages', 'app development cost India', 'Saampark services'],
};
```
