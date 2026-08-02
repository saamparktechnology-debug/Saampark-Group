# 13 — SEO Strategy

> Comprehensive SEO specification for the Saampark Group website.

---

## SEO Goals

1. Rank in top 3 for local searches: "website development Paschim Medinipur", "digital marketing West Bengal"
2. Rank nationally for affordable service searches: "dynamic website ₹11999", "Meta ads management India"
3. Capture zero-click SERP features via structured data (FAQs, rich snippets)
4. Build domain authority through consistent blog content

---

## Target Keywords

### STR — Technology

| Keyword | Intent | Priority |
|---------|--------|---------|
| website development West Bengal | Commercial | High |
| website development Paschim Medinipur | Local | High |
| affordable website development India | Commercial | High |
| dynamic website with admin panel | Commercial | High |
| e-commerce website India ₹21999 | Transactional | High |
| android app development West Bengal | Commercial | Medium |
| cheap website design India | Commercial | Medium |
| ISO certified web development | Trust | Medium |

### SCS — Consultancy

| Keyword | Intent | Priority |
|---------|--------|---------|
| digital marketing West Bengal | Commercial | High |
| Meta ads management India | Commercial | High |
| Google ads management affordable | Commercial | High |
| Google Business Profile management | Commercial | High |
| social media marketing ₹499 | Transactional | High |
| company registration West Bengal | Commercial | Medium |
| GST registration India | Commercial | Medium |
| AI video creation India | Commercial | Medium |

---

## Page-Level SEO Specs

### Homepage

```ts
title: 'Saampark Group | Website, App Development & Digital Marketing India'
description: 'ISO 9001:2015 certified Saampark Group offers website development, mobile app development, digital marketing, Meta Ads, Google Ads, and business legal services. Serving India from West Bengal. Starting ₹499.'
canonical: 'https://www.saampark.com'
ogImage: '/assets/og/homepage-og.png'
```

### Technology Landing

```ts
title: 'Website & App Development | Saampark Technology & Research Pvt. Ltd.'
description: 'Build your business online with Saampark Technology. One-page websites from ₹1,999. Dynamic websites, e-commerce, Android apps, iOS apps. ISO certified. West Bengal.'
canonical: 'https://www.saampark.com/technology'
```

### Consultancy Landing

```ts
title: 'Digital Marketing & Business Solutions | Saampark Consultancy Service'
description: 'Grow your business with Saampark Consultancy — social media management from ₹499/month, Meta Ads, Google Ads, Google Business Profile, company registration & video creation. ISO certified.'
canonical: 'https://www.saampark.com/consultancy'
```

---

## Structured Data (JSON-LD) — Global

### Organization Schema (Homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Saampark Group",
  "url": "https://www.saampark.com",
  "logo": "https://www.saampark.com/assets/logos/saampark-group-logo.png",
  "description": "ISO 9001:2015 certified technology and consultancy group offering website development, app development, digital marketing, and business solutions.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Balichak (Station Road)",
    "addressLocality": "Debra",
    "addressRegion": "Paschim Medinipur, West Bengal",
    "postalCode": "721124",
    "addressCountry": "IN"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "telephone": "+91-9091518567",
      "contactType": "sales",
      "areaServed": "IN"
    },
    {
      "@type": "ContactPoint",
      "telephone": "+91-8170082678",
      "contactType": "customer service",
      "areaServed": "IN"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/saampark",
    "https://www.instagram.com/saampark",
    "https://www.youtube.com/@saampark"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Saampark Services"
  }
}
```

### LocalBusiness Schema (Contact Page)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Saampark Group",
  "image": "https://www.saampark.com/assets/logos/saampark-group-logo.png",
  "priceRange": "₹₹",
  "telephone": "+91-9091518567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Balichak (Station Road)",
    "addressLocality": "Debra",
    "addressRegion": "West Bengal",
    "postalCode": "721124",
    "addressCountry": "IN"
  },
  "openingHours": "Mo-Sa 09:00-20:00",
  "url": "https://www.saampark.com"
}
```

### Service Schema (Product Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Dynamic Website Development",
  "provider": {
    "@type": "Organization",
    "name": "Saampark Technology & Research Pvt. Ltd."
  },
  "description": "Complete dynamic website with admin panel, database, and user management.",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "11999",
    "priceValidUntil": "2025-12-31"
  },
  "areaServed": "IN",
  "serviceType": "Web Development"
}
```

---

## Technical SEO Checklist

### Meta Tags
- [x] Unique `<title>` on every page (55–65 chars)
- [x] Unique `<meta description>` on every page (120–160 chars)
- [x] `<meta robots>` — index, follow on all public pages
- [x] Canonical tags on all pages
- [x] Open Graph tags (og:title, og:description, og:image, og:url)
- [x] Twitter Card tags

### Performance
- [x] Images: WebP format, compressed, explicit width/height
- [x] Fonts: Preconnect, swap display
- [x] CSS: No render-blocking, critical CSS inline
- [x] JavaScript: Deferred non-critical, code-split
- [x] Caching headers set (Vercel edge caching)
- [x] Brotli compression enabled

### Crawlability
- [x] `robots.txt` — allow all, disallow /api/
- [x] XML sitemap at `/sitemap.xml` (auto-generated by Next.js)
- [x] Internal linking — every service links to related services
- [x] No broken links (CI check)
- [x] 404 page with navigation

### Mobile
- [x] Responsive on all viewports (320px+)
- [x] Touch targets ≥ 44×44px
- [x] No horizontal scroll
- [x] Viewport meta tag set

---

## robots.txt

```
User-agent: *
Allow: /

Disallow: /api/
Disallow: /_next/
Disallow: /admin/

Sitemap: https://www.saampark.com/sitemap.xml
```

---

## Blog SEO

Target publishing cadence: **2 articles per month at launch**

### Article Template
- Word count: 1,000–2,000 words
- H1: One per page, includes primary keyword
- H2–H4: Structured, keyword-rich
- Internal links: Minimum 3 to related service pages
- External links: 1–2 to authoritative sources
- Featured image: Optimized, descriptive alt text
- Meta description: Compelling, 120–155 characters

### Initial Articles (Priority)
1. "How to Choose the Right Website Package for Your Business" — targets "website package India"
2. "Meta Ads vs Google Ads: Which Is Better for Small Businesses?" — targets "Meta ads vs Google ads India"
3. "Why Your Business Needs a Google Business Profile in 2024" — targets "Google Business Profile India"
4. "Top 5 Reasons to Get a Dynamic Website for Your Business"
5. "How Much Does an Android App Cost in India?"
