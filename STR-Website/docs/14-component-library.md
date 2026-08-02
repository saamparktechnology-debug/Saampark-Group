# 14 — Component Library

> Catalog of all reusable UI components, their props, variants, and usage guidelines.

---

## Component Principles

1. **Atomic design** — atoms → molecules → organisms → templates → pages
2. **Accessible** — ARIA roles, keyboard nav, focus states on all interactive components
3. **Token-driven** — All visual values come from CSS custom properties
4. **Self-documenting** — Component names describe their purpose clearly

---

## Button Component

### Variants
| Variant | Use Case |
|---------|---------|
| `primary` | Main CTA (one per section) |
| `secondary` | Alternative/ghost action |
| `outline` | Tertiary, less prominent |
| `ghost` | Minimal, nav-style |
| `destructive` | Delete/danger actions |
| `link` | Inline text links |

### Sizes
| Size | Height | Padding |
|------|--------|---------|
| `xs` | 28px | 0 10px |
| `sm` | 36px | 0 14px |
| `md` | 44px | 0 20px (default) |
| `lg` | 52px | 0 28px |
| `xl` | 60px | 0 36px |

### Props
```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;       // Shows spinner, disables
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  href?: string;           // Renders as <Link> if provided
  onClick?: () => void;
  children: React.ReactNode;
}
```

### CSS
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--size-2);
  font-family: var(--font-body);
  font-weight: var(--btn-font-weight);
  border-radius: var(--btn-radius);
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--btn-transition);
  white-space: nowrap;
  text-decoration: none;
}

.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.btn-primary:hover { background: var(--btn-primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  background: transparent;
  color: var(--color-brand);
  border-color: var(--color-brand);
}
.btn-secondary:hover { background: var(--color-brand-subtle); }
```

---

## Card Component

### Variants
| Variant | Use Case |
|---------|---------|
| `default` | Standard content card |
| `service` | Service offering card |
| `pricing` | Pricing plan card |
| `blog` | Blog post preview card |
| `testimonial` | Client testimonial |
| `stat` | Single statistic display |
| `glass` | Glassmorphic overlay card |

### Service Card Props
```ts
interface ServiceCardProps {
  icon: React.ReactNode;
  iconColor?: string;
  badge?: string;
  title: string;
  description: string;
  features?: string[];
  price?: number | string;
  priceType?: 'one-time' | 'monthly' | 'weekly' | 'on-request';
  cta?: { label: string; href: string };
  isPopular?: boolean;
  entity?: 'str' | 'scs';
}
```

---

## Badge Component

```ts
interface BadgeProps {
  variant: 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;   // Adds a status dot
  children: React.ReactNode;
}
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--badge-padding);
  border-radius: var(--badge-radius);
  font-size: var(--badge-font-size);
  font-weight: 600;
  letter-spacing: 0.02em;
}
.badge-brand   { background: var(--color-brand-subtle); color: var(--color-brand); }
.badge-success { background: var(--color-success-subtle); color: var(--color-success); }
```

---

## Input Component

```ts
interface InputProps {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  required?: boolean;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}
```

---

## Select / Dropdown

```ts
interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}
```

---

## Accordion / FAQ Component

```ts
interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}
interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;  // Default: false (only one open at a time)
}
```

---

## Tabs Component

```ts
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}
interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'underline' | 'pills' | 'boxed';
}
```

---

## Skeleton Component

```ts
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  count?: number;       // Renders N stacked skeletons
  className?: string;
}
```

---

## Modal Component

```ts
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  children: React.ReactNode;
}
```

---

## Toast / Notification Component

```ts
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;  // ms, default 4000
}
```

---

## Stats Counter Component

Animated count-up triggered by IntersectionObserver.

```ts
interface StatProps {
  value: number;
  suffix?: string;   // e.g. "+" for "500+"
  prefix?: string;   // e.g. "₹"
  label: string;
  icon?: React.ReactNode;
  duration?: number; // animation duration ms, default 2000
}
```

---

## Pricing Card Component

```ts
interface PricingCardProps {
  name: string;
  price: number | null;
  priceType: 'one-time' | 'monthly' | 'weekly' | 'on-request';
  features: string[];
  notIncluded?: string[];
  badge?: string;
  isRecommended?: boolean;
  cta: { label: string; href: string };
}
```

---

## Component File Naming Convention

```
components/
  ui/
    Button/
      Button.tsx
      Button.module.css
      Button.types.ts
      index.ts           ← re-exports Button
```

Each component exported from its `index.ts` and documented in Storybook (v2 goal).
