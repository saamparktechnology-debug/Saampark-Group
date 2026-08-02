# 15 — About Page

> Spec for the Saampark Group "About Us" page at `/about`.

---

## Page Goal

Build trust, human connection, and authority. Visitors who reach the About page are evaluating whether Saampark is worth their business. This page must answer:
- Who is behind Saampark?
- Why were we founded?
- What do we stand for?
- Are we credible and professional?

---

## Page Layout

```
[01] Hero — "Our Story"
[02] Mission & Vision
[03] The Two Entities
[04] Our Values
[05] Certifications & Achievements
[06] Team Section
[07] Company Timeline
[08] Client Logos (if available)
[09] CTA — "Work With Us"
```

---

## [01] Hero

```
Background: Dark navy with subtle parallax
Headline: "Built on Excellence, Driven by Growth"
Sub: "Saampark Group is an ISO 9001:2015 certified conglomerate
      uniting technology development and business consultancy
      to empower businesses across India."

[Group Logo] centered below headline
```

---

## [02] Mission & Vision

**Layout:** 2-column cards, teal accent border

**Mission:**
> "To deliver world-class digital solutions that are accessible, affordable, and transformative for businesses of all sizes across India."

**Vision:**
> "To become India's most trusted end-to-end digital partner — from building your website to growing your brand online."

---

## [03] The Two Entities

**Layout:** 2-column feature cards with logos

**STR Card:**
- Headline: "Saampark Technology & Research Pvt. Ltd."
- Logo: STR circular icon
- Description: Building the digital foundation of Indian businesses — websites, mobile apps, and software that scale
- Services highlighted: Web Dev, App Dev, Software
- Link: "Explore Technology →"

**SCS Card:**
- Headline: "Saampark Consultancy Service"
- Logo: SCS mark
- Description: Driving measurable digital growth through intelligent marketing, advertising, and business consulting
- Services highlighted: Digital Marketing, Ads, Legal
- Link: "Explore Consultancy →"

---

## [04] Our Values

**Layout:** 3-column icon grid

| Icon | Value | Description |
|------|-------|-------------|
| Award | Excellence | We don't settle for less. Every project meets ISO-certified quality standards |
| Shield | Integrity | Transparent pricing, honest timelines, no hidden surprises |
| Heart | Partnership | Your success is our success. We build long-term relationships, not one-off transactions |
| Lightbulb | Innovation | We stay ahead of technology trends to bring you cutting-edge solutions |
| Users | Inclusivity | We serve everyone — from solo entrepreneurs to enterprises — with equal dedication |
| TrendingUp | Growth-Focus | Every recommendation we make is designed to grow your business |

---

## [05] Certifications & Achievements

**Layout:** Horizontal achievement bar / cards

| Achievement | Detail |
|------------|--------|
| 🏆 ISO 9001:2015 | Certified quality management system |
| 📋 Pvt. Ltd. Registered | Legally incorporated company |
| 500+ | Projects delivered |
| 300+ | Happy clients |
| 5+ | Years of experience |
| 40+ | Service categories |

---

## [06] Team Section

**Layout:** Card grid with professional photos

_[Add actual team member photos and bios before launch]_

### Team Member Card Structure
```
[Photo]
[Name]
[Role / Designation]
[LinkedIn icon]
[Short bio — 2 lines]
```

### Core Team (placeholder roles)
- Founder & CEO
- CTO (Chief Technology Officer)
- Head of Digital Marketing
- Lead Web Developer
- Lead App Developer
- Business Development Manager
- Creative Designer

---

## [07] Company Timeline

**Layout:** Vertical timeline, alternating left/right on desktop

```
2019 → Founded as Saampark Technology in Debra, West Bengal
2020 → Expanded services to include digital marketing under SCS
2021 → Achieved ISO 9001:2015 certification
2022 → 100+ clients milestone reached
2023 → Launched Android & iOS app development division
2024 → 500+ projects delivered; expanded to national clients
2025 → Saampark Group officially formed as parent entity
```

---

## [08] Client Logos

If client permission obtained, display a horizontally scrolling logo marquee.

**Behavior:** Auto-scrolling, pauses on hover, 2 rows on mobile

_[Populate before launch with real client logos with permissions]_

---

## [09] CTA

```
Dark teal background
"Ready to Work with Saampark Group?"
"Whether you're launching your first website or scaling your digital marketing — we're the partner you've been looking for."

[Get a Free Consultation]   [See Our Services]
```

---

## SEO

```ts
title: 'About Saampark Group | ISO Certified Technology & Consultancy Company'
description: 'Learn about Saampark Group — ISO 9001:2015 certified technology and consultancy company from West Bengal, India. We offer website development, app development, digital marketing & legal services.'
canonical: 'https://www.saampark.com/about'
```

## Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Saampark Group",
  "url": "https://www.saampark.com/about",
  "description": "About page for Saampark Group — ISO 9001:2015 certified technology and digital consultancy group."
}
```
