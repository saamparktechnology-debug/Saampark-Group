# 06 — Homepage Experience

> The Saampark Group homepage is the single most important page. It must communicate who we are, what we offer, and why to choose us — within the first 5 seconds.

---

## Page Goal

Convert visitors into leads by clearly presenting:
1. **Who** — Saampark Group (two entities, one vision)
2. **What** — Technology + Consultancy services
3. **Why** — ISO certified, trusted, affordable, comprehensive
4. **How** — Explore services, view packages, get in touch

---

## Above-the-Fold Strategy

The hero must answer: *"Am I in the right place?"* in under 3 seconds.

---

## Section Architecture

```
[01] Navigation Bar
[02] Hero Section ← Most critical
[03] Group Overview (Two Subsidiaries)
[04] Stats / Trust Bar
[05] STR Services Preview
[06] SCS Services Preview
[07] Why Choose Us
[08] Featured Packages
[09] Testimonials / Social Proof
[10] Technology Stack Showcase (STR)
[11] Call to Action Banner
[12] Blog / Knowledge Preview
[13] Contact Teaser
[14] Footer
```

---

## Section Specs

### [01] Navigation Bar

**Type:** Sticky, glassmorphic, collapses on scroll
**Height:** 72px desktop / 60px mobile

**Left:** Saampark Group Logo (SVG, 40px height)
**Center:** Primary nav links (desktop only)
**Right:** Theme toggle + "Get a Quote" CTA button

#### Navigation Links
```
Home | Technology | Consultancy | Marketplace | About | Contact
```

#### Behavior
- **Transparent** at top of page (over hero)
- **Glassmorphic** once user scrolls 80px
- **Mobile:** Hamburger → full-screen drawer with all links + CTA
- **Active state:** Teal underline on current page link

---

### [02] Hero Section

**Layout:** Full-viewport (100vh min), centered content, dark background
**Background:** Deep navy gradient with subtle animated particle/mesh overlay

#### Content Structure
```
[Badge]       "ISO 9001:2015 Certified | Co-Powered by Saampark Group"

[Headline]    "Grow Your Business
               Digitally"

[Subheadline] "From websites and apps to digital marketing and legal solutions —
               Saampark Group delivers end-to-end digital excellence for businesses
               across India."

[CTAs]        [Explore Services →]  [Talk to Us]

[Trust Pills] ✓ 500+ Projects  ✓ ISO Certified  ✓ 2 Expert Teams  ✓ Pan-India
```

#### Visual Elements
- Animated floating gradient orbs (teal + blue-green) in background
- Logo mark softly glowing behind headline text
- Scroll-down indicator (animated chevron) at bottom

#### Typography
- Headline: `--text-display-2xl` (72px), Poppins 800, white
- "Digitally" in teal gradient text (`--gradient-text-brand`)
- Subheadline: `--text-body-xl` (20px), Inter 400, `rgba(255,255,255,0.75)`

#### CTA Buttons
- Primary: "Explore Services →" — teal filled, `--btn-radius`
- Secondary: "Talk to Us" — ghost, white border

#### Animation Sequence (on page load, after splash)
```
0ms   → Badge slides down + fades in
150ms → Headline slides up + fades in (word by word, 50ms stagger)
400ms → Subheadline fades in
600ms → CTAs scale in (ease-spring)
800ms → Trust pills fade in (50ms stagger)
```

---

### [03] Group Overview (Two Subsidiaries)

**Layout:** Two-column split card (equal width), with visual divider
**Background:** Cream/light mode default; dark elevated on dark mode

#### STR Card
- Logo: STR circular icon (colorful)
- Label: "Saampark Technology & Research Pvt. Ltd."
- Short: "Building the digital infrastructure of tomorrow"
- Highlights: Web Dev, App Dev, Software Solutions
- CTA: "Explore Technology →"
- Accent color: Teal → Blue gradient

#### SCS Card
- Logo: SCS building mark (green/charcoal)
- Label: "Saampark Consultancy Service"
- Short: "Driving growth through intelligent digital marketing"
- Highlights: Digital Marketing, Ads, Video, Legal
- CTA: "Explore Consultancy →"
- Accent color: Green → Orange gradient

#### Section Header
```
"Two Entities. One Vision."
"Saampark Group unites technology development and business consultancy
 under a single trusted brand."
```

---

### [04] Stats / Trust Bar

**Layout:** Full-width, dark navy background, 4-column stats row
**Style:** Large number + label + subtle icon

| Stat | Value | Label |
|------|-------|-------|
| Projects Delivered | 500+ | Websites, Apps & Campaigns |
| Happy Clients | 300+ | Across West Bengal & India |
| Service Categories | 40+ | Under one roof |
| Years of Excellence | 5+ | Est. in Paschim Medinipur |

**Animation:** Count-up animation triggered when section enters viewport

---

### [05] STR Services Preview

**Layout:** 4-column grid of service cards on desktop, 2 on tablet, 1 on mobile
**Background:** Light (cream) section

#### Section Header
```
"Technology That Scales"
"From simple one-page websites to complex enterprise software — STR delivers."
```

#### Service Cards (4 featured)

| Service | Icon | Starting Price | Color |
|---------|------|---------------|-------|
| One Page Website | Globe | ₹1,999/offer | Teal |
| Static Website | Layout | ₹3,999 | Blue |
| Dynamic Website | Zap | ₹11,999 | Orange |
| E-Commerce Website | ShoppingCart | ₹21,999 | Green |

**Card anatomy:**
- Icon (48px, brand color)
- Service name (bold)
- 2–3 bullet features
- Starting price badge
- "Learn More →" link

**Footer CTA:** "See All Web Solutions" + "App Development" links

---

### [06] SCS Services Preview

**Layout:** 2×2 grid + 1 wide card (bento-style), dark background
**Background:** Deep navy section

#### Section Header
```
"Marketing That Delivers Results"
"SCS brings your business to the forefront of the digital landscape."
```

#### Featured Services (5 cards)

| Service | Icon | Highlight |
|---------|------|-----------|
| Social Media Control | Users | ₹499/month, 4 posters |
| Meta Ads | Megaphone | Weekly ₹600 → Premium ₹9,499 |
| Google Ads | Search | Weekly ₹1,000 → Premium ₹19,999 |
| Google Business Profile | MapPin | ₹1,000–₹20,000+/month |
| Video & AI Ads | Video | Simple ₹499 → Full AI ₹1,499 |

---

### [07] Why Choose Us

**Layout:** 3-column feature grid + large supporting visual
**Background:** Alternating light

#### Features

| Icon | Title | Description |
|------|-------|-------------|
| Award | ISO 9001:2015 Certified | Quality management assured across all services |
| Layers | End-to-End Solutions | From concept to deployment, we handle everything |
| IndianRupee | Transparent Pricing | No hidden charges. Clear packages for every budget |
| MapPin | Local Expertise | Deep roots in West Bengal; understanding of Indian markets |
| Headphones | Dedicated Support | Ongoing support after project delivery |
| TrendingUp | Growth-Oriented | Our goal: your measurable business growth |

---

### [08] Featured Packages

**Layout:** Horizontal scroll / 3-column grid — "Most Popular" badge on one
**Background:** Subtle gradient, light mode

#### Packages Shown (3 most popular cross-entity)

1. **Starter Digital Bundle** — Website (₹3,999) + Social Media (₹499/month)
2. **Growth Package** — Dynamic Website (₹11,999) + Meta Ads (₹2,000/month)
3. **Business Accelerator** — E-Commerce (₹21,999) + Google Ads (₹3,500/month) + GBP

**CTA:** "Explore Full Marketplace →"

---

### [09] Testimonials / Social Proof

**Layout:** Auto-scrolling carousel, 3 visible on desktop
**Background:** Navy, subtle

#### Testimonial Card
- Quote text
- Client name + business name
- Star rating (5 stars)
- Service received

_[Populate with real client testimonials before launch]_

#### Social Proof Bar
```
⭐ 4.9/5 average rating  |  300+ clients  |  ISO certified  |  West Bengal's leading digital partner
```

---

### [10] Technology Stack (STR Showcase)

**Layout:** Icon grid, dark background, subtle
**Purpose:** Reinforce technical credibility

#### Technologies shown
PHP, JavaScript, React, Next.js, Android (Kotlin), iOS (Swift), Flutter, MySQL, Firebase, WordPress, and more.

---

### [11] CTA Banner

**Layout:** Full-width, teal gradient background
**Content:**
```
"Ready to Grow Your Business Digitally?"

"Talk to Saampark Group today. Whether you need a website, an app, 
 or a complete digital marketing strategy — we're here."

[Get a Free Consultation]  [Call Now: 9091518567]
```

---

### [12] Blog / Knowledge Preview

**Layout:** 3-column card grid (if blog enabled)
**Background:** Light

Articles to produce for launch:
- "How to Choose the Right Website Package for Your Business"
- "Meta Ads vs Google Ads: Which is Right for Your Business?"
- "Why Every Indian Business Needs a Google Business Profile"

---

### [13] Contact Teaser

**Layout:** 2-column — contact info left, mini-form right
**Background:** Dark navy

```
Left side:
  📍 Balichak, Debra, Paschim Medinipur, WB 721124
  📞 9091518567 / 8170082678
  ✉️ service@saamparktechnologyresearch.in
  🌐 www.saampark.com

Right side: [Mini contact form — Name, Phone, Message, Submit]
```

---

### [14] Footer

**Layout:** 4-column grid on desktop, stacked on mobile
**Background:** Deep navy (`#0D1B2A`)

```
Col 1: Logo + tagline + social icons (FB, IG, YT, WA)
Col 2: STR services links
Col 3: SCS services links
Col 4: Company (About, Contact, Blog, Privacy, Terms)

Bottom bar: © 2024 Saampark Group | ISO 9001:2015 Certified | Made with ❤️ in West Bengal
```

---

## Mobile Adaptations

| Section | Mobile Behavior |
|---------|----------------|
| Hero | Text centered, CTAs stacked vertically |
| Group Overview | Cards stacked vertically |
| Stats Bar | 2×2 grid |
| Service Cards | Horizontal scroll snap |
| Why Choose Us | Single column |
| Testimonials | Single card, swipe |
| CTA Banner | Stacked, centered |
| Footer | 2-column → single column |
