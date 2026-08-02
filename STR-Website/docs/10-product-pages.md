# 10 — Product Pages

> Spec for individual service/product detail pages. Every package in the Marketplace links to a Product Page.

---

## Purpose

Product pages convert browsing intent into contact/inquiry action. Each page must:
1. Fully describe the service/package
2. Clearly state what's included (and what's not)
3. Show transparent pricing
4. Build trust (ISO, process, guarantee)
5. Have a clear, prominent CTA above the fold
6. Be fully SEO optimized

---

## Page Template Structure

### URL Pattern
```
/technology/web-development/[plan]
/technology/app-development/[type]
/consultancy/digital-marketing/[service]
/consultancy/ads-management/[type]
/consultancy/video-ai/[type]
/consultancy/business-legal/[service]
```

---

## Standard Product Page Layout

```
[01] Breadcrumb Navigation
[02] Hero / Header Section
[03] What's Included
[04] Pricing Tiers (if multiple)
[05] Step-by-Step Process
[06] Technologies Used (STR only)
[07] FAQ Section
[08] Related Services
[09] CTA — Get Quote / Contact
[10] Trust Signals Bar
```

---

## Section Specs

### [01] Breadcrumb
```
Home > Technology > Web Development > Dynamic Website
```
- Schema: `BreadcrumbList` JSON-LD
- Style: Small, linked, gray text with `>` separator

---

### [02] Hero / Header Section

**Layout:** 2-column — text left, visual right (illustration or screenshot)
**Background:** Dark navy (STR) or dark teal gradient (SCS)

```
[Entity Badge]   e.g. "STR — Technology"

[Service Name]   "Dynamic Website"

[Tagline]        "A complete web solution with admin panel,
                  database, and everything your business needs
                  to manage itself online."

[Price Display]  Starting at ₹11,999

[CTAs]           [Get Quote Now]  [Call: 9091518567]

[Trust Chips]    ⚡ 10–15 Days  |  🛡️ ISO Certified  |  📞 30-Day Support
```

---

### [03] What's Included

**Layout:** 2-column checklist grid

```tsx
const features = [
  { included: true,  text: 'Admin Panel (CMS)' },
  { included: true,  text: 'Database Integration (MySQL)' },
  { included: true,  text: 'User Login System' },
  { included: true,  text: 'Complete Management System' },
  { included: true,  text: 'Mobile Responsive Design' },
  { included: true,  text: 'Search Functionality' },
  { included: true,  text: 'Contact & Inquiry Management' },
  { included: true,  text: 'Newsletter Integration' },
  { included: true,  text: 'Advanced SEO Setup' },
  { included: false, text: 'Payment Gateway (available as add-on)' },
  { included: false, text: 'Mobile App (separate package)' },
];
```

**Visual:** ✅ green checkmark for included, ➕ gray for add-ons

---

### [04] Pricing Tiers

Only shown for services with multiple price points (e.g., SCS Ads packages).

```
┌──────────────┬──────────────┬──────────────┐
│   Weekly     │   Monthly    │   Premium    │
│   ₹1,000     │   ₹3,500     │   ₹19,999   │
│              │              │ [Recommended]│
│  ✓ Feature   │  ✓ Feature   │  ✓ Feature  │
│  ✓ Feature   │  ✓ Feature   │  ✓ Feature  │
│              │  ✓ Feature   │  ✓ Feature  │
│              │              │  ✓ Feature  │
│  [Get Quote] │  [Get Quote] │  [Get Quote]│
└──────────────┴──────────────┴──────────────┘
```

---

### [05] Step-by-Step Process

**Layout:** Numbered steps with icons, horizontal on desktop, vertical on mobile

#### STR Web Development Process
```
Step 1 → Requirements Gathering
         "We understand your business, goals, and design preferences"

Step 2 → Design Mockup
         "Our designers create wireframes and visual mockups for your approval"

Step 3 → Development
         "Our developers build your website with clean, efficient code"

Step 4 → Testing & Review
         "Cross-browser, cross-device testing. You review and request changes."

Step 5 → Launch & Handover
         "We deploy your site and hand over all credentials and source code"
```

#### SCS Ads Campaign Process
```
Step 1 → Consultation
         "Understanding your business, product, target audience, and budget"

Step 2 → Strategy & Planning
         "Building campaign structure, selecting audiences, keywords, and objectives"

Step 3 → Creative Production
         "Designing ad creatives — images, videos, copy"

Step 4 → Campaign Launch
         "Setting up and activating your ad campaigns"

Step 5 → Monitor & Optimize
         "Daily/weekly monitoring, budget optimization, A/B testing"

Step 6 → Report
         "Detailed performance report with insights and next steps"
```

---

### [06] Technologies Used (STR only)

**Layout:** Logo pill grid
**Show:** Only the techs relevant to this specific service

e.g., for Dynamic Website:
```
PHP  |  MySQL  |  JavaScript  |  Bootstrap  |  cPanel
```

---

### [07] FAQ Section

**Layout:** Accordion
**Schema:** FAQPage JSON-LD

#### Dynamic Website FAQs (example)
```
Q: What is the difference between a static and dynamic website?
A: A static website shows the same content to everyone with no backend.
   A dynamic website has a database and admin panel, letting you update
   content without touching code.

Q: Do I get the source code?
A: Yes. Full source code is handed over on project completion.

Q: What happens after launch?
A: You get 30 days of free bug-fix support. Extended maintenance plans available.

Q: Can I upgrade later?
A: Absolutely. We design all websites to be scalable.

Q: Do you provide hosting?
A: We guide you on hosting setup. Managed hosting plans also available.
```

---

### [08] Related Services

**Layout:** 3 horizontal cards linking to related product pages

e.g., for Dynamic Website → related:
- E-Commerce Website
- Android App Development
- Google Business Profile (SCS)

---

### [09] CTA — Get Quote / Contact

**Layout:** Full-width, brand-colored background, centered

```
"Ready to get started with your Dynamic Website?"

[Name]    [Phone Number]
[Business Name]    [Email]
[Message]
[Submit — Get a Free Quote]

OR

Call us directly:  📞 9091518567  |  📞 9091518569
```

**Form behavior:**
- Submit → POST `/api/contact`
- Body: `{ service, name, phone, businessName, email, message }`
- Success: Inline success message "Thank you! We'll contact you within 24 hours."
- Error: Inline error with retry

---

### [10] Trust Signals Bar

**Layout:** Horizontal bar, 4 items

```
🏆 ISO 9001:2015 Certified  |  ✅ 500+ Projects  |  ⚡ Fast Delivery  |  📞 30-Day Support
```

---

## Product Page — Complete List

### STR Product Pages

| Page | URL | Starting Price |
|------|-----|---------------|
| One Page Website | `/technology/web-development/one-page-website` | ₹1,999 |
| Static Website | `/technology/web-development/static-website` | ₹3,999 |
| Dynamic Website | `/technology/web-development/dynamic-website` | ₹11,999 |
| E-Commerce Website | `/technology/web-development/ecommerce-website` | ₹21,999 |
| Android App | `/technology/app-development/android` | On Request |
| iOS App | `/technology/app-development/ios` | On Request |
| Hybrid App | `/technology/app-development/hybrid` | On Request |
| Custom Software | `/technology/software-solutions/custom` | On Request |

### SCS Product Pages

| Page | URL | Starting Price |
|------|-----|---------------|
| Social Media Management | `/consultancy/digital-marketing/social-media` | ₹499/mo |
| Meta Ads | `/consultancy/ads-management/meta-ads` | ₹600/week |
| Google Ads | `/consultancy/ads-management/google-ads` | ₹1,000/week |
| Google Business Profile | `/consultancy/digital-marketing/google-business-profile` | ₹1,000/mo |
| Simple Video | `/consultancy/video-ai/simple-video` | ₹499 |
| Poster Video | `/consultancy/video-ai/poster-video` | ₹599 |
| Cartoon Video | `/consultancy/video-ai/cartoon-video` | ₹699 |
| Motion AI Video | `/consultancy/video-ai/motion-ai-video` | ₹799 |
| Full AI Video | `/consultancy/video-ai/full-ai-video` | ₹1,499 |
| 4K AI Video | `/consultancy/video-ai/4k-ai-video` | ₹1,999 |
| Business Registration | `/consultancy/business-legal/company-registration` | On Request |
| GST Registration | `/consultancy/business-legal/gst-registration` | On Request |

---

## SEO Template (per product page)

```ts
// Example: Dynamic Website
export const metadata = {
  title: 'Dynamic Website Development | Saampark Technology & Research',
  description: 'Get a fully-featured dynamic website with admin panel, database, and user management system starting at ₹11,999. ISO certified web development in West Bengal.',
  keywords: ['dynamic website India', 'website with admin panel', 'dynamic web development West Bengal', 'Saampark website'],
  openGraph: {
    title: 'Dynamic Website Development — Starting ₹11,999 | STR',
    description: 'Admin panel, database, user login. Full web management system.',
    images: ['/assets/og/dynamic-website-og.png'],
  },
};
```
