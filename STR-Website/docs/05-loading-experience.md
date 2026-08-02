# 05 — Loading Experience

> Defines every aspect of the site's loading states — splash screen, skeleton loaders, page transitions, and progressive enhancement.

---

## Philosophy

The loading experience is the user's **first impression**. It must:
1. Be **branded** — feel like Saampark from the very first frame
2. Be **fast** — never block content longer than necessary
3. Be **graceful** — skeleton states that accurately mirror final content
4. Be **purposeful** — no gratuitous animations; only what serves the user

---

## Initial Page Load Splash Screen

### Trigger
- Only shown on the **very first visit** or after **hard refresh** of the homepage
- Skipped on subsequent navigations (SPA transitions)
- Controlled via `sessionStorage.getItem('saampark-loaded')`

### Sequence (Total: ~1.5–2s)

```
0ms    → Dark navy background (#0D1B2A) fills viewport
0ms    → Saampark logo mark appears at center, scale: 0.8, opacity: 0
200ms  → Logo scales to 1.0, opacity: 1 (ease-spring, 400ms)
600ms  → Wordmark "SAAMPARK GROUP" fades in below logo (400ms)
1000ms → Tagline "Aspire For Optimum Excellence" fades in (300ms)
1300ms → Entire splash begins fade-out (opacity: 0, 400ms)
1700ms → Splash removed from DOM; homepage renders
```

### CSS Implementation

```css
.splash-screen {
  position: fixed;
  inset: 0;
  background: var(--primitive-navy-900);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--size-4);
  z-index: 9999;
  transition: opacity var(--duration-slow) var(--ease-decelerate);
}

.splash-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

.splash-logo {
  width: 80px;
  height: 80px;
  opacity: 0;
  transform: scale(0.8);
  animation: splashLogoIn 400ms 200ms var(--ease-spring) forwards;
}

.splash-wordmark {
  opacity: 0;
  animation: splashFadeIn 400ms 600ms var(--ease-decelerate) forwards;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.05em;
}

.splash-tagline {
  opacity: 0;
  animation: splashFadeIn 300ms 1000ms var(--ease-decelerate) forwards;
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

@keyframes splashLogoIn {
  to { opacity: 1; transform: scale(1); }
}

@keyframes splashFadeIn {
  to { opacity: 1; }
}
```

### JavaScript Logic

```ts
// SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('saampark-loaded');
    if (!hasLoaded) {
      setVisible(true);
      const fadeTimer = setTimeout(() => setFading(true), 1300);
      const removeTimer = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem('saampark-loaded', 'true');
      }, 1700);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!visible) return null;

  return (
    <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
      <img src="/assets/logos/saampark-group-logo.png" className="splash-logo" alt="" />
      <div className="splash-wordmark">SAAMPARK GROUP</div>
      <div className="splash-tagline">Aspire For Optimum Excellence</div>
    </div>
  );
}
```

---

## Page Transition System

### Type: Fade + Slight Upward Slide
- Duration: 300ms in, 200ms out
- Curve: `ease-decelerate` for in, `ease-accelerate` for out

### Implementation (Next.js App Router)

```tsx
// components/layout/PageWrapper/PageWrapper.tsx
'use client';

import { useEffect, useRef } from 'react';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('page-enter');
    const t = setTimeout(() => el.classList.add('page-enter-active'), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={ref} className="page-wrapper">
      {children}
    </div>
  );
}
```

```css
.page-wrapper {
  min-height: 100vh;
}

.page-enter {
  opacity: 0;
  transform: translateY(12px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 300ms var(--ease-decelerate),
    transform 300ms var(--ease-decelerate);
}
```

---

## Skeleton Loaders

### Skeleton Shimmer Animation (Global)

```css
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton {
  border-radius: var(--radius-md);
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

/* Light mode */
[data-theme="light"] .skeleton {
  background: linear-gradient(
    90deg,
    var(--primitive-gray-200) 25%,
    var(--primitive-gray-100) 50%,
    var(--primitive-gray-200) 75%
  );
  background-size: 400px 100%;
}

/* Dark mode */
[data-theme="dark"] .skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.06) 25%,
    rgba(255,255,255,0.10) 50%,
    rgba(255,255,255,0.06) 75%
  );
  background-size: 400px 100%;
}
```

### Skeleton Variants

#### Service Card Skeleton
```tsx
export function ServiceCardSkeleton() {
  return (
    <div className="service-card-skeleton">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      <div className="skeleton" style={{ width: '60%', height: 20, marginTop: 16 }} />
      <div className="skeleton" style={{ width: '100%', height: 14, marginTop: 8 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginTop: 6 }} />
      <div className="skeleton" style={{ width: 100, height: 36, marginTop: 20, borderRadius: 8 }} />
    </div>
  );
}
```

#### Pricing Card Skeleton
```tsx
export function PricingCardSkeleton() {
  return (
    <div className="pricing-card-skeleton">
      <div className="skeleton" style={{ width: '40%', height: 16 }} />
      <div className="skeleton" style={{ width: '60%', height: 36, marginTop: 12 }} />
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton" style={{ width: `${70 + i*5}%`, height: 14, marginTop: 10 }} />
      ))}
      <div className="skeleton" style={{ width: '100%', height: 48, marginTop: 20, borderRadius: 10 }} />
    </div>
  );
}
```

#### Hero Section Skeleton
```tsx
export function HeroSkeleton() {
  return (
    <section className="hero-skeleton">
      <div className="skeleton" style={{ width: '30%', height: 16, margin: '0 auto' }} />
      <div className="skeleton" style={{ width: '80%', height: 56, margin: '16px auto 0' }} />
      <div className="skeleton" style={{ width: '60%', height: 56, margin: '8px auto 0' }} />
      <div className="skeleton" style={{ width: '50%', height: 20, margin: '16px auto 0' }} />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
        <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 140, height: 48, borderRadius: 10 }} />
      </div>
    </section>
  );
}
```

---

## Image Loading

### Strategy
- All `<Image />` components use `loading="lazy"` by default
- Above-the-fold hero images use `priority={true}`
- Placeholder: `placeholder="blur"` with low-quality blur data URI
- Always define `width` and `height` to prevent CLS

### Pattern
```tsx
<Image
  src="/assets/images/hero-bg.jpg"
  alt="Saampark Group — Digital Excellence"
  width={1280}
  height={720}
  priority={true}          // ← Above fold only
  quality={85}
  className="hero-image"
/>
```

---

## Font Loading

```html
<!-- In <head> — preconnect for Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

<!-- Load Inter + Poppins with display=swap -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap"
  rel="stylesheet"
/>
```

### Font Display Strategy
```css
/* Prevent invisible text during load */
@font-face {
  font-display: swap;
}
```

---

## Loading States Summary

| Scenario | Behavior |
|----------|---------|
| First visit (homepage) | Full splash screen (1.7s) |
| Subsequent page nav | Fade+slide transition (300ms) |
| Data fetching | Skeleton loaders |
| Image loading | Blur placeholder → full image |
| Font loading | System font fallback → brand font (FOUT prevented by preload) |
| Form submitting | Button shows spinner + "Sending..." text |
| Error state | Inline error with retry option |
