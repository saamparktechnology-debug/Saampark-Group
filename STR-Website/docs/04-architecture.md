# 04 — Architecture

> Technical blueprint for the Saampark Group website. All structural decisions are final unless updated here first.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG, SEO, file-based routing, React Server Components |
| **Language** | TypeScript | Type safety, better DX, fewer runtime errors |
| **Styling** | Vanilla CSS (Custom Properties) | Maximum flexibility, no dependency lock-in, token-based |
| **Icons** | Lucide React | MIT licensed, consistent, tree-shakeable |
| **Fonts** | Google Fonts (Inter, Poppins) | Free, high-quality, variable font support |
| **Animation** | CSS animations + Framer Motion (selective) | CSS for micro-animations, Framer for complex sequences |
| **Forms** | React Hook Form + Zod | Lightweight, performant, schema validation |
| **Email** | Resend / Nodemailer | Contact form email delivery |
| **Images** | Next.js Image (`<Image />`) | Automatic optimization, WebP, lazy loading |
| **CMS** | MDX files (v1) → Sanity (v2) | Markdown for blogs; CMS for dynamic content later |
| **Deployment** | Vercel | Zero-config Next.js hosting, edge CDN |
| **Analytics** | Vercel Analytics + Google Analytics 4 | Privacy-first + detailed event tracking |
| **SEO** | Next.js Metadata API | Native, RSC-compatible metadata generation |

---

## Folder Structure

```
saampark/
├── public/
│   ├── assets/
│   │   ├── logos/
│   │   │   ├── saampark-group-logo.png
│   │   │   ├── str-logo.png
│   │   │   ├── scs-logo.png
│   │   │   └── saampark-group-logo.svg
│   │   ├── images/
│   │   ├── icons/
│   │   └── og/               ← Open Graph images
│   ├── favicon.ico
│   ├── robots.txt
│   └── sitemap.xml           ← Auto-generated
│
├── src/
│   ├── app/                  ← Next.js App Router
│   │   ├── layout.tsx        ← Root layout (nav, footer, theme provider)
│   │   ├── page.tsx          ← Homepage
│   │   ├── globals.css       ← All CSS custom properties + base styles
│   │   │
│   │   ├── (group)/          ← Saampark Group pages
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── blog/
│   │   │
│   │   ├── technology/       ← STR pages
│   │   │   ├── page.tsx      ← STR landing
│   │   │   ├── web-development/
│   │   │   ├── app-development/
│   │   │   ├── software-solutions/
│   │   │   └── [service]/    ← Dynamic service pages
│   │   │
│   │   ├── consultancy/      ← SCS pages
│   │   │   ├── page.tsx      ← SCS landing
│   │   │   ├── digital-marketing/
│   │   │   ├── ads-management/
│   │   │   ├── business-legal/
│   │   │   ├── video-ai/
│   │   │   └── [service]/
│   │   │
│   │   ├── marketplace/      ← Package explorer
│   │   │   ├── page.tsx
│   │   │   └── [category]/
│   │   │
│   │   └── api/
│   │       ├── contact/route.ts
│   │       └── newsletter/route.ts
│   │
│   ├── components/
│   │   ├── ui/               ← Atomic, reusable components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Badge/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Modal/
│   │   │   ├── Tooltip/
│   │   │   ├── Skeleton/
│   │   │   ├── Tabs/
│   │   │   └── Accordion/
│   │   │
│   │   ├── layout/           ← Layout shell components
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   ├── Sidebar/
│   │   │   └── PageWrapper/
│   │   │
│   │   ├── sections/         ← Page section blocks
│   │   │   ├── Hero/
│   │   │   ├── Services/
│   │   │   ├── Stats/
│   │   │   ├── Testimonials/
│   │   │   ├── CTA/
│   │   │   ├── FAQ/
│   │   │   ├── Pricing/
│   │   │   └── Contact/
│   │   │
│   │   └── features/         ← Feature-specific components
│   │       ├── ServiceCard/
│   │       ├── PricingCard/
│   │       ├── PackageFilter/
│   │       ├── ContactForm/
│   │       ├── ThemeToggle/
│   │       └── FloatingCTA/
│   │
│   ├── lib/
│   │   ├── data/             ← Static data (services, pricing, team)
│   │   │   ├── str-services.ts
│   │   │   ├── scs-services.ts
│   │   │   ├── pricing.ts
│   │   │   └── testimonials.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts         ← Class name utility
│   │   │   ├── format.ts     ← Number/date formatting
│   │   │   └── seo.ts        ← SEO helpers
│   │   │
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   ├── useScrollPosition.ts
│   │   │   └── useIntersectionObserver.ts
│   │   │
│   │   └── constants/
│   │       ├── navigation.ts
│   │       ├── contact.ts
│   │       └── seo.ts
│   │
│   └── types/
│       ├── service.ts
│       ├── pricing.ts
│       └── navigation.ts
│
├── docs/                     ← THIS FOLDER — project source of truth
├── content/                  ← MDX blog articles
│   └── blog/
│
├── .env.local                ← Environment variables
├── .env.example
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Routing Structure

| URL | Page | Entity |
|-----|------|--------|
| `/` | Saampark Group Homepage | Group |
| `/about` | About Saampark Group | Group |
| `/contact` | Contact page | Group |
| `/blog` | Blog listing | Group |
| `/blog/[slug]` | Blog article | Group |
| `/technology` | STR landing page | STR |
| `/technology/web-development` | Web dev services | STR |
| `/technology/web-development/[plan]` | Specific web plan | STR |
| `/technology/app-development` | App dev services | STR |
| `/technology/software-solutions` | Software services | STR |
| `/consultancy` | SCS landing page | SCS |
| `/consultancy/digital-marketing` | Social media, GBP | SCS |
| `/consultancy/ads-management` | Meta & Google Ads | SCS |
| `/consultancy/business-legal` | Legal & business services | SCS |
| `/consultancy/video-ai` | Video & AI ad services | SCS |
| `/marketplace` | All packages explorer | Group |
| `/marketplace/[category]` | Filtered packages | Group |

---

## Component Architecture Principles

### 1. Server-First
- Default to React Server Components (RSC)
- Only add `'use client'` when truly needed (interactivity, hooks, browser APIs)
- Keep client component boundaries as small as possible

### 2. Single Responsibility
- Each component does one thing well
- No component file exceeds 200 lines
- Complex components are split into sub-components

### 3. Composition Over Configuration
- Build complex UIs by composing small components
- Avoid mega-components with dozens of props

### 4. CSS Module Pattern
- Each component has its own `.module.css` file
- All styles scoped to component; no global style bleeding
- Use CSS custom properties from the global theme

### 5. Data Flow
```
lib/data/*.ts  →  Page (RSC)  →  Section  →  UI Component
                    (server)      (server)     (client if interactive)
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO | 100 |
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| TTFB (Time to First Byte) | < 600ms |
| Bundle size (initial JS) | < 100KB gzipped |

---

## SEO Architecture

### Metadata per page (Next.js Metadata API)
```ts
export const metadata: Metadata = {
  title: 'Page Title | Saampark Group',
  description: '...',
  keywords: ['...'],
  openGraph: {
    title: '...',
    description: '...',
    images: ['/assets/og/page-og.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '...',
    description: '...',
    images: ['/assets/og/page-og.png'],
  },
  alternates: {
    canonical: 'https://www.saampark.com/page',
  },
};
```

### Structured Data (JSON-LD)
- `Organization` schema on homepage
- `LocalBusiness` schema on contact page
- `Service` schema on all service pages
- `FAQPage` schema on FAQ sections
- `BreadcrumbList` on all inner pages
- `WebPage` schema sitewide

---

## Environment Variables

```env
# .env.local

# Contact form email
RESEND_API_KEY=
CONTACT_EMAIL_TO=saamparktechnologyresearch@gmail.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Site
NEXT_PUBLIC_SITE_URL=https://www.saampark.com

# Feature flags
NEXT_PUBLIC_ENABLE_BLOG=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
```

---

## Git Workflow

```
main            → production (auto-deploys to Vercel)
develop         → staging
feature/*       → feature branches (PR into develop)
fix/*           → bug fixes (PR into develop)
hotfix/*        → emergency fixes (PR directly into main)
```

### Commit Convention
```
feat: add marketplace filter component
fix: resolve mobile nav overflow issue
docs: update architecture guide
style: align card grid spacing
refactor: extract contact form hook
perf: optimize hero image loading
```
