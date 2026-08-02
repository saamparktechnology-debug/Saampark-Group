# 03 — Theme System

> CSS custom properties (design tokens) that power all visual styling. Always reference tokens — never hard-code values.

---

## Design Token Architecture

Tokens are organized in three layers:

```
Layer 1: Primitive Tokens   → Raw values (colors, sizes, durations)
Layer 2: Semantic Tokens    → Meaningful aliases (--color-surface, --color-on-surface)
Layer 3: Component Tokens   → Component-scoped overrides (--btn-bg, --card-radius)
```

---

## Global CSS Custom Properties

```css
:root {
  /* ─── PRIMITIVE: Brand Colors ─────────────────────────── */
  --primitive-teal-100:    #CCEFED;
  --primitive-teal-200:    #99DFD9;
  --primitive-teal-400:    #33C9BF;
  --primitive-teal-500:    #00B4A6;
  --primitive-teal-600:    #009B8E;
  --primitive-teal-700:    #007A74;
  --primitive-teal-900:    #003D3A;

  --primitive-navy-900:    #0D1B2A;
  --primitive-navy-800:    #162032;
  --primitive-navy-700:    #1E293B;
  --primitive-charcoal:    #1C1C1C;

  --primitive-orange-500:  #F4511E;
  --primitive-yellow-500:  #F5A623;
  --primitive-blue-500:    #1E90FF;
  --primitive-green-500:   #4CAF50;
  --primitive-purple-500:  #8B5CF6;

  --primitive-gray-50:     #FAFAFA;
  --primitive-gray-100:    #F4F4F5;
  --primitive-gray-200:    #E4E4E7;
  --primitive-gray-300:    #D1D5DB;
  --primitive-gray-400:    #9CA3AF;
  --primitive-gray-500:    #6B7280;
  --primitive-gray-600:    #4B5563;
  --primitive-gray-700:    #374151;
  --primitive-gray-800:    #1F2937;
  --primitive-gray-900:    #111827;

  --primitive-white:       #FFFFFF;
  --primitive-cream:       #F8F7F4;

  /* ─── PRIMITIVE: Typography ────────────────────────────── */
  --font-display:   'Poppins', sans-serif;
  --font-body:      'Inter', 'Outfit', sans-serif;
  --font-mono:      'JetBrains Mono', 'Fira Code', monospace;

  /* ─── PRIMITIVE: Sizing ─────────────────────────────────── */
  --size-0:    0px;
  --size-1:    4px;
  --size-2:    8px;
  --size-3:    12px;
  --size-4:    16px;
  --size-5:    20px;
  --size-6:    24px;
  --size-8:    32px;
  --size-10:   40px;
  --size-12:   48px;
  --size-16:   64px;
  --size-20:   80px;
  --size-24:   96px;
  --size-32:  128px;
  --size-40:  160px;

  /* ─── PRIMITIVE: Border Radius ──────────────────────────── */
  --radius-none:   0px;
  --radius-sm:     4px;
  --radius-md:     8px;
  --radius-lg:     12px;
  --radius-xl:     16px;
  --radius-2xl:    24px;
  --radius-full:   9999px;

  /* ─── PRIMITIVE: Shadows ────────────────────────────────── */
  --shadow-xs:  0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-sm:  0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10);
  --shadow-2xl: 0 25px 50px -12px rgba(0,0,0,0.25);
  --shadow-glow-teal: 0 0 20px rgba(0,180,166,0.35);
  --shadow-glow-navy: 0 0 30px rgba(13,27,42,0.50);

  /* ─── PRIMITIVE: Motion ─────────────────────────────────── */
  --duration-instant:  100ms;
  --duration-fast:     200ms;
  --duration-normal:   300ms;
  --duration-slow:     500ms;
  --duration-slower:   700ms;
  --duration-slowest: 1000ms;

  --ease-standard:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── PRIMITIVE: Z-index ────────────────────────────────── */
  --z-below:    -1;
  --z-base:      0;
  --z-raised:   10;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  300;
  --z-modal:    400;
  --z-toast:    500;
  --z-tooltip:  600;
}
```

---

## Light Theme (Default)

```css
[data-theme="light"],
:root {
  /* ─── Backgrounds ─────────────────────────────────────── */
  --color-bg-page:         var(--primitive-cream);
  --color-bg-surface:      var(--primitive-white);
  --color-bg-surface-alt:  var(--primitive-gray-50);
  --color-bg-elevated:     var(--primitive-white);
  --color-bg-sunken:       var(--primitive-gray-100);
  --color-bg-overlay:      rgba(0, 0, 0, 0.5);

  /* ─── Text ────────────────────────────────────────────── */
  --color-text-primary:    var(--primitive-gray-900);
  --color-text-secondary:  var(--primitive-gray-600);
  --color-text-tertiary:   var(--primitive-gray-400);
  --color-text-disabled:   var(--primitive-gray-300);
  --color-text-inverse:    var(--primitive-white);
  --color-text-brand:      var(--primitive-teal-600);

  /* ─── Borders ─────────────────────────────────────────── */
  --color-border-default:  var(--primitive-gray-200);
  --color-border-strong:   var(--primitive-gray-400);
  --color-border-brand:    var(--primitive-teal-500);

  /* ─── Brand ───────────────────────────────────────────── */
  --color-brand:           var(--primitive-teal-500);
  --color-brand-hover:     var(--primitive-teal-600);
  --color-brand-active:    var(--primitive-teal-700);
  --color-brand-subtle:    var(--primitive-teal-100);
  --color-brand-on-brand:  var(--primitive-white);

  /* ─── Semantic ────────────────────────────────────────── */
  --color-success:         #10B981;
  --color-success-subtle:  #ECFDF5;
  --color-warning:         #F59E0B;
  --color-warning-subtle:  #FFFBEB;
  --color-error:           #EF4444;
  --color-error-subtle:    #FEF2F2;
  --color-info:            #3B82F6;
  --color-info-subtle:     #EFF6FF;

  /* ─── Shadow overrides for light mode ─────────────────── */
  --shadow-card:  var(--shadow-sm);
  --shadow-hover: var(--shadow-md);
}
```

---

## Dark Theme

```css
[data-theme="dark"] {
  /* ─── Backgrounds ─────────────────────────────────────── */
  --color-bg-page:         var(--primitive-navy-900);
  --color-bg-surface:      var(--primitive-navy-800);
  --color-bg-surface-alt:  var(--primitive-navy-700);
  --color-bg-elevated:     #1E2D3D;
  --color-bg-sunken:       #0A1520;
  --color-bg-overlay:      rgba(0, 0, 0, 0.75);

  /* ─── Text ────────────────────────────────────────────── */
  --color-text-primary:    #F0F4F8;
  --color-text-secondary:  #94A3B8;
  --color-text-tertiary:   #64748B;
  --color-text-disabled:   #475569;
  --color-text-inverse:    var(--primitive-charcoal);
  --color-text-brand:      var(--primitive-teal-400);

  /* ─── Borders ─────────────────────────────────────────── */
  --color-border-default:  rgba(255,255,255,0.08);
  --color-border-strong:   rgba(255,255,255,0.16);
  --color-border-brand:    var(--primitive-teal-500);

  /* ─── Brand ───────────────────────────────────────────── */
  --color-brand:           var(--primitive-teal-400);
  --color-brand-hover:     var(--primitive-teal-500);
  --color-brand-active:    var(--primitive-teal-600);
  --color-brand-subtle:    rgba(0, 180, 166, 0.12);
  --color-brand-on-brand:  var(--primitive-navy-900);

  /* ─── Semantic ────────────────────────────────────────── */
  --color-success:         #34D399;
  --color-success-subtle:  rgba(52, 211, 153, 0.10);
  --color-warning:         #FCD34D;
  --color-warning-subtle:  rgba(252, 211, 77, 0.10);
  --color-error:           #F87171;
  --color-error-subtle:    rgba(248, 113, 113, 0.10);
  --color-info:            #60A5FA;
  --color-info-subtle:     rgba(96, 165, 250, 0.10);

  /* ─── Shadow overrides for dark mode ──────────────────── */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-hover: 0 4px 12px rgba(0,0,0,0.5);
}
```

---

## Component Tokens

```css
/* ─── Navigation ──────────────────────────── */
--nav-height:        72px;
--nav-height-mobile: 60px;
--nav-bg:            rgba(255,255,255,0.9);
--nav-bg-dark:       rgba(13,27,42,0.95);
--nav-blur:          blur(12px);
--nav-border:        1px solid var(--color-border-default);

/* ─── Buttons ─────────────────────────────── */
--btn-radius:        var(--radius-lg);
--btn-font-weight:   600;
--btn-transition:    all var(--duration-fast) var(--ease-standard);

--btn-primary-bg:    var(--color-brand);
--btn-primary-text:  var(--color-brand-on-brand);
--btn-primary-hover: var(--color-brand-hover);

--btn-secondary-bg:       transparent;
--btn-secondary-border:   var(--color-brand);
--btn-secondary-text:     var(--color-brand);

/* ─── Cards ───────────────────────────────── */
--card-bg:           var(--color-bg-surface);
--card-border:       1px solid var(--color-border-default);
--card-radius:       var(--radius-xl);
--card-padding:      var(--size-6);
--card-shadow:       var(--shadow-card);
--card-shadow-hover: var(--shadow-hover);

/* ─── Inputs ──────────────────────────────── */
--input-bg:          var(--color-bg-sunken);
--input-border:      var(--color-border-default);
--input-border-focus:var(--color-brand);
--input-radius:      var(--radius-lg);
--input-height:      48px;
--input-padding:     0 var(--size-4);

/* ─── Sections ────────────────────────────── */
--section-padding-y: var(--size-20);
--section-padding-x: var(--size-6);
--section-max-width: 1280px;

/* ─── Grid ────────────────────────────────── */
--grid-cols-mobile: 1;
--grid-cols-tablet: 2;
--grid-cols-desktop: 3;
--grid-gap:         var(--size-6);

/* ─── Badge ───────────────────────────────── */
--badge-radius:      var(--radius-full);
--badge-padding:     2px 10px;
--badge-font-size:   var(--text-body-xs);

/* ─── Tooltip ─────────────────────────────── */
--tooltip-bg:        var(--primitive-gray-900);
--tooltip-text:      var(--primitive-white);
--tooltip-radius:    var(--radius-md);
--tooltip-padding:   6px 12px;
```

---

## Responsive Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm:   640px;   /* Small tablets */
--bp-md:   768px;   /* Tablets */
--bp-lg:  1024px;   /* Laptops */
--bp-xl:  1280px;   /* Desktops */
--bp-2xl: 1536px;   /* Large screens */
```

```css
/* Usage pattern */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## Glassmorphism Utilities

```css
.glass-light {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.30);
}

.glass-dark {
  background: rgba(13, 27, 42, 0.75);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.glass-teal {
  background: rgba(0, 180, 166, 0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 180, 166, 0.20);
}
```

---

## Gradient System

```css
--gradient-brand:         linear-gradient(135deg, #00B4A6 0%, #007A74 100%);
--gradient-brand-vivid:   linear-gradient(135deg, #00D4C8 0%, #00B4A6 50%, #007A74 100%);
--gradient-dark:          linear-gradient(135deg, #0D1B2A 0%, #162032 100%);
--gradient-hero-dark:     linear-gradient(180deg, #0D1B2A 0%, #1E293B 100%);
--gradient-hero-light:    linear-gradient(180deg, #F8F7F4 0%, #FFFFFF 100%);
--gradient-card-hover:    linear-gradient(135deg, rgba(0,180,166,0.05) 0%, rgba(0,180,166,0.10) 100%);
--gradient-text-brand:    linear-gradient(90deg, #00B4A6 0%, #00D4C8 100%);
--gradient-orange:        linear-gradient(135deg, #F4511E 0%, #F5A623 100%);
--gradient-blue-green:    linear-gradient(135deg, #1E90FF 0%, #4CAF50 100%);
```

---

## Theme Toggle Implementation

The site supports both **Light** and **Dark** modes. Default should respect `prefers-color-scheme`.

```js
// Theme detection and toggle logic
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('saampark-theme');
const theme = savedTheme || (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', theme);

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('saampark-theme', next);
}
```
