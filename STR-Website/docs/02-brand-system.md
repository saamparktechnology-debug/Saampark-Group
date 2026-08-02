# 02 — Brand System

> **Source of truth for all visual identity decisions. No deviation permitted without written approval.**

---

## Brand Identity Overview

Saampark Group is a professional, ISO-certified technology and consultancy conglomerate. The brand must communicate:
- **Trust & credibility** — established, certified, reliable
- **Innovation & forward-thinking** — tech-first, modern solutions
- **Accessibility** — serving SMEs, startups, and enterprises across India
- **Warmth & partnership** — not just a vendor, but a growth partner

---

## Logo System

### Saampark Group (Parent Brand)
- **Mark:** 3D stylized "S" letterform with rising bar-chart integrated into the counter-space
- **Color:** Teal (`#00B4A6`) stroke over charcoal-black (`#1C1C1C`) structural bars
- **Wordmark:** "SAAMPARK GROUP" in bold condensed uppercase, charcoal black
- **Background:** Light cream / white
- **Style:** 3D, extruded, premium wall-mounted aesthetic
- **File:** `WhatsApp Image 2026-07-15 at 10.02.11 PM.jpeg`

### STR — Saampark Technology & Research Pvt. Ltd.
- **Mark:** Circular arrangement of 4 icons: human figure (orange), gear (yellow-orange), microchip (blue), growth arrow/bars (green)
- **Meaning:** People + Process + Technology + Growth
- **Wordmark:** "SAAMPARK" in bold black, "TECHNOLOGY & RESEARCH PVT. LTD." in regular weight below
- **File:** `WhatsApp Image 2026-07-15 at 9.59.42 PM.jpeg`

### SCS — Saampark Consultancy Service
- **Mark:** Stylized "S" + rising building silhouette, green on dark charcoal
- **Wordmark:** "SAAMPARK CONSULTANCY SERVICE" in structured typography
- **Style:** Professional, consultancy-feel

### Logo Usage Rules
1. Never stretch, rotate, or recolor logos
2. Maintain minimum clear space equal to the height of the "S" letterform on all sides
3. Use on-brand backgrounds only (white, cream, deep navy, or dark charcoal)
4. Never place logo on busy photographic backgrounds without a container/card
5. Always use vector/SVG versions in digital; raster only as fallback

---

## Color Palette

### Primary Colors

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-teal` | Saampark Teal | `#00B4A6` | Primary brand accent, CTAs, links, highlights |
| `--color-charcoal` | Charcoal Black | `#1C1C1C` | Headers, nav, heavy text |
| `--color-navy` | Deep Navy | `#0D1B2A` | Dark backgrounds, footers |

### Secondary Colors (STR Palette)

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-orange` | Energy Orange | `#F4511E` | STR icon, urgency, highlights |
| `--color-yellow` | Gear Yellow | `#F5A623` | STR icon, badges, pricing callouts |
| `--color-blue` | Tech Blue | `#1E90FF` | STR icon, technology sections |
| `--color-green` | Growth Green | `#4CAF50` | STR icon, success states, growth indicators |

### Neutral Colors

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-white` | Pure White | `#FFFFFF` | Backgrounds, card surfaces |
| `--color-cream` | Soft Cream | `#F8F7F4` | Page backgrounds (light mode) |
| `--color-gray-100` | Ghost Gray | `#F4F4F5` | Input backgrounds, subtle fills |
| `--color-gray-300` | Divider Gray | `#D1D5DB` | Borders, dividers |
| `--color-gray-500` | Mid Gray | `#6B7280` | Body text, captions |
| `--color-gray-700` | Dark Gray | `#374151` | Secondary headings, labels |
| `--color-gray-900` | Near Black | `#111827` | Body text on light backgrounds |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#10B981` | Success states, checkmarks |
| `--color-warning` | `#F59E0B` | Warnings, attention |
| `--color-error` | `#EF4444` | Errors, required fields |
| `--color-info` | `#3B82F6` | Info notices, tooltips |

---

## Typography

### Font Stack

```css
/* Primary — Display & UI */
font-family: 'Inter', 'Outfit', sans-serif;

/* Secondary — Accent headings */
font-family: 'Poppins', sans-serif;

/* Monospace — Code, tags */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display-2xl` | 72px | 800 | 1.1 | Hero headlines |
| `--text-display-xl` | 56px | 700 | 1.15 | Section heroes |
| `--text-display-lg` | 42px | 700 | 1.2 | Page titles |
| `--text-display-md` | 32px | 600 | 1.25 | Section headings |
| `--text-display-sm` | 24px | 600 | 1.3 | Card titles, sub-headings |
| `--text-body-xl` | 20px | 400 | 1.6 | Lead paragraphs |
| `--text-body-lg` | 18px | 400 | 1.6 | Body copy |
| `--text-body-md` | 16px | 400 | 1.6 | Default body |
| `--text-body-sm` | 14px | 400 | 1.5 | Captions, meta |
| `--text-body-xs` | 12px | 400 | 1.4 | Labels, badges |

### Typography Rules
- Use **Inter** for all UI elements, navigation, and body text
- Use **Poppins** for hero headlines and section titles only
- Never use more than 3 font sizes in a single section
- Maximum line length: 72 characters for body text
- Always ensure 4.5:1 contrast ratio for body text (WCAG AA)

---

## Iconography

### Icon Library
- **Primary:** Lucide Icons (MIT licensed, consistent stroke style)
- **Supplementary:** Custom SVG icons matching brand colors for service categories

### Service Category Icons

| Service | Icon | Color |
|---------|------|-------|
| Website Development | `<Globe />` | Teal |
| App Development | `<Smartphone />` | Blue |
| Software Solutions | `<Code2 />` | Navy |
| Digital Marketing | `<TrendingUp />` | Green |
| Meta Ads | `<Megaphone />` | Orange |
| Google Ads | `<Search />` | Yellow |
| Google Business | `<MapPin />` | Green |
| Legal/Business Services | `<Briefcase />` | Charcoal |
| Video & AI Services | `<Video />` | Purple |

### Icon Usage Rules
1. Always use consistent stroke width (2px default)
2. Icon size minimum: 16px; recommended in context: 20–24px
3. Icons must always be accompanied by a text label (accessibility)
4. Color icons only in their designated brand color on white/cream backgrounds

---

## Imagery & Photography Style

### Style Guidelines
- **Tone:** Professional, modern, aspirational — not stock-photo generic
- **Subject:** Real technology scenarios, business environments, diverse professionals
- **Treatment:** Light, airy backgrounds OR deep dark immersive backgrounds
- **Avoid:** Cheesy handshakes, overly posed corporate photos, low-resolution imagery

### Illustration Style (if used)
- Flat with subtle gradients
- Brand color palette only
- Tech-themed: dashboards, devices, data, connectivity

---

## Motion & Animation Principles

### Brand Motion Language
- **Smooth:** Ease-in-out curves, never abrupt or jarring
- **Purposeful:** Every animation must have a functional reason
- **Fast:** UI transitions ≤ 300ms; page transitions ≤ 600ms
- **Subtle:** Micro-interactions, not distracting spectacles

### Animation Tokens
```css
--duration-instant:  100ms;
--duration-fast:     200ms;
--duration-normal:   300ms;
--duration-slow:     500ms;
--duration-slower:   700ms;

--ease-standard:     cubic-bezier(0.4, 0, 0.2, 1);
--ease-decelerate:   cubic-bezier(0, 0, 0.2, 1);
--ease-accelerate:   cubic-bezier(0.4, 0, 1, 1);
--ease-spring:       cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Voice & Tone

### Brand Voice Pillars

| Pillar | Description | Example |
|--------|-------------|---------|
| **Expert** | Knowledgeable, authoritative, confident | "We engineer digital solutions that scale." |
| **Accessible** | Clear, jargon-free, inclusive | "We build websites that work for your business." |
| **Ambitious** | Forward-looking, growth-oriented | "Grow Your Business Digitally" |
| **Warm** | Friendly, approachable, partner-minded | "Let's build something great together." |

### Tone by Context

| Context | Tone |
|---------|------|
| Hero headlines | Bold, ambitious, inspiring |
| Service descriptions | Clear, expert, reassuring |
| Pricing | Direct, transparent, value-focused |
| CTAs | Action-oriented, confident |
| Error messages | Calm, helpful, solution-focused |
| Social proof | Authentic, factual |

### Writing Rules
1. Lead with benefits, not features
2. Use active voice always
3. Avoid jargon unless the audience is technical
4. Numbers beat adjectives: "₹1,999 one-page website" beats "affordable website"
5. One idea per sentence
