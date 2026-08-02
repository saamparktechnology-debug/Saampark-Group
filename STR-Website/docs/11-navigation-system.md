# 11 — Navigation System

> Defines all navigation patterns, menus, mobile behavior, and link hierarchy.

---

## Navigation Structure

### Primary Navigation (Desktop)

```
Logo  |  Home  Technology  Consultancy  Marketplace  About  Contact  |  🌙  [Get a Quote]
```

### Mega Menu — Technology (STR)
Appears on hover/focus of "Technology" link:

```
┌─────────────────────────────────────────────────────┐
│  Website Development        App Development          │
│  ──────────────────         ────────────────         │
│  One Page Website           Android App              │
│  Static Website             iOS App                  │
│  Dynamic Website            Hybrid App               │
│  E-Commerce Website                                  │
│                             Software Solutions       │
│  Other Solutions            ──────────────────       │
│  ──────────────             Custom Software          │
│  [View All 28+ Solutions →]                          │
│                                                      │
│  🎯 [Start Your Project →]                           │
└─────────────────────────────────────────────────────┘
```

### Mega Menu — Consultancy (SCS)
```
┌─────────────────────────────────────────────────────┐
│  Digital Marketing          Ads Management           │
│  ──────────────────         ──────────────────       │
│  Social Media Control       Meta Ads                 │
│  Google Business Profile    Google Ads               │
│                                                      │
│  Video & AI                 Business & Legal         │
│  ──────────────────         ──────────────────       │
│  Simple Video               Company Registration     │
│  AI Video                   GST Registration         │
│  4K AI Video                MSME Registration        │
│                                                      │
│  🎯 [Grow Your Business →]                           │
└─────────────────────────────────────────────────────┘
```

---

## Mobile Navigation

### Hamburger → Full Screen Drawer

```
┌──────────────────────────────────┐
│  [Logo]              [✕ Close]  │
├──────────────────────────────────┤
│  Home                           │
│  Technology               [>]  │
│    └ Web Development            │
│    └ App Development            │
│    └ Software                   │
│  Consultancy              [>]  │
│    └ Digital Marketing          │
│    └ Ads Management             │
│    └ Video & AI                 │
│    └ Business & Legal           │
│  Marketplace                    │
│  About                          │
│  Contact                        │
├──────────────────────────────────┤
│  [Get a Quote]                  │
│  📞 9091518567                  │
└──────────────────────────────────┘
```

**Behavior:**
- Drawer slides in from right
- Sub-items expand inline (no new page)
- Body scroll locked when drawer open
- Overlay behind drawer (dark, 50% opacity)
- Close on ESC key, overlay click, or X button

---

## Navbar Scroll Behavior

| Scroll Position | Navbar State |
|----------------|-------------|
| 0–79px | Transparent, absolute positioned |
| 80px+ | Glassmorphic, sticky, drop shadow |

```css
.navbar {
  position: sticky;
  top: 0;
  height: var(--nav-height);
  transition: background var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard);
  z-index: var(--z-sticky);
}

.navbar.scrolled {
  background: var(--nav-bg);
  backdrop-filter: var(--nav-blur);
  box-shadow: var(--shadow-sm);
}
```

---

## Active Link States

```css
.nav-link {
  position: relative;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color var(--duration-fast);
}

.nav-link:hover,
.nav-link.active {
  color: var(--color-text-primary);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-brand);
  border-radius: var(--radius-full);
}
```

---

## Breadcrumb System

Used on all inner pages (not homepage).

```
Home > Technology > Web Development > Dynamic Website
```

```tsx
const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Technology', href: '/technology' },
  { label: 'Web Development', href: '/technology/web-development' },
  { label: 'Dynamic Website', href: null }, // current page, no link
];
```

**Schema (JSON-LD):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://saampark.com" },
    { "@type": "ListItem", "position": 2, "name": "Technology", "item": "https://saampark.com/technology" },
    { "@type": "ListItem", "position": 3, "name": "Web Development", "item": "https://saampark.com/technology/web-development" },
    { "@type": "ListItem", "position": 4, "name": "Dynamic Website" }
  ]
}
```

---

## Footer Navigation

### Columns

**Column 1: Saampark Group**
- About Saampark
- Our Story
- ISO Certification
- Careers
- Privacy Policy
- Terms of Service

**Column 2: Technology (STR)**
- One Page Website
- Static Website
- Dynamic Website
- E-Commerce Website
- App Development
- Software Solutions

**Column 3: Consultancy (SCS)**
- Social Media Management
- Meta Ads
- Google Ads
- Google Business Profile
- Video & AI Services
- Business & Legal

**Column 4: Connect**
- Contact Us
- WhatsApp: 9091518567
- Call: 8170082678
- Marketplace
- Blog
- [Social icons: FB, IG, YT, WA]

---

## Floating CTA (Mobile)

A persistent bottom floating bar on mobile for quick contact:

```
┌─────────────────────────────────────┐
│  📞 Call Now    💬 WhatsApp Chat    │
└─────────────────────────────────────┘
```

- Fixed to bottom of viewport on mobile only
- Appears after user scrolls past hero
- Links: `tel:9091518567` and `https://wa.me/919091518567`
