# Dashboard Redesign Spec (RISE Clone)

## 1) Goals

- Improve scan speed and reduce dashboard clutter.
- Increase text contrast and action discoverability.
- Establish a stable, reusable design token system.
- Keep visual style aligned with the existing product (no disruptive rebrand).

## 2) Scope

- Page: `src/app/page.tsx`
- Global styling/tokens: `src/app/globals.css`
- Dashboard widgets:
  - `src/components/dashboard/ClockWidget.tsx`
  - `src/components/dashboard/StatCard.tsx`
  - `src/components/dashboard/ProjectsOverview.tsx`
  - `src/components/dashboard/InvoiceOverview.tsx`
  - `src/components/dashboard/IncomeExpenses.tsx`
  - `src/components/dashboard/TaskOverview.tsx`
  - `src/components/dashboard/TeamMembers.tsx`
  - `src/components/dashboard/TicketStatus.tsx`
  - `src/components/dashboard/AnnouncementWidget.tsx`
  - `src/components/dashboard/ProjectTimeline.tsx`
  - `src/components/dashboard/EventsList.tsx`
  - `src/components/dashboard/TodoWidget.tsx`

## 3) Layout Spec

### 3.1 Desktop (`>=1280px`)

- Grid: 12 columns, `24px` gutters.
- Dashboard row order:
  1. Primary KPI row (3 cards): `Open tasks`, `Events today`, `Amount due`
  2. Secondary quick-actions row: `Clock In/Out`, `Next reminder`
  3. Operations row: `Invoice overview` (8 cols), `Income vs Expense` (4 cols)
  4. Delivery row: `Project timeline` (8 cols), `Todo` (4 cols)
  5. Supporting row: `Projects overview` (4 cols), `Task overview` (4 cols), `Ticket status` (4 cols)
  6. Announcement full-width (12 cols)

### 3.2 Tablet (`768px - 1279px`)

- Grid: 8 columns, `16px` gutters.
- Top row: KPI cards become 2+1 wrap.
- Two-column sections stack as `5/3` or `4/4` based on content density.

### 3.3 Mobile (`<768px`)

- Single column.
- Priority order:
  1. KPI cards
  2. Urgent items (`Due`, reminders, overdue invoices)
  3. Todo + today events
  4. Charts and historical widgets

## 4) Design Tokens

Add/normalize tokens in `src/app/globals.css`:

```css
:root {
  --bg-page: #f5f7fb;
  --bg-card: #ffffff;
  --bg-muted: #f8fafc;

  --text-strong: #1f2937;
  --text-default: #374151;
  --text-muted: #6b7280;
  --text-subtle: #9ca3af;

  --border-default: #dbe2ea;
  --border-soft: #e9eef5;

  --brand-500: #2563eb;
  --brand-600: #1d4ed8;

  --success-500: #16a34a;
  --warning-500: #d97706;
  --danger-500: #dc2626;
  --info-500: #0891b2;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --shadow-card: 0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1);
  --shadow-card-hover: 0 8px 20px rgba(16, 24, 40, 0.08);
}
```

## 5) Typography

- Body: `14px`, line-height `1.5`.
- Widget title: `14px`, semibold.
- KPI value: `28px`, bold.
- KPI label: `12px`, medium, muted.
- Avoid light gray for essential data (numbers/statuses must use `--text-strong`).

## 6) Component Rules

### 6.1 KPI Cards (`StatCard.tsx`)

- Remove decorative gradients as default.
- Default card style: white background, subtle border, single accent icon chip.
- Keep only one high-emphasis KPI (`Amount due`) with warning/danger accent.

### 6.2 Clock Widget (`ClockWidget.tsx`)

- Move to secondary row as quick action.
- Primary button style for `Clock In`/`Clock Out`.
- Timestamp text should be muted but readable (`--text-default`, not gray-500).

### 6.3 Overview Widgets

- Header pattern consistency:
  - Left: title + icon
  - Right: optional action (`More`, `View all`)
- Equal internal spacing (`padding: 20px`, section gaps `16px`).
- Use one chart + one takeaway sentence (`+8% vs last month`, `5 overdue invoices`).

### 6.4 Todo/Timeline

- Todo is operationally critical, place above less critical analytics on smaller screens.
- Timeline rows should highlight actor + action + entity with clear hierarchy.

## 7) Accessibility

- Text contrast:
  - Body min `4.5:1`
  - Large text min `3:1`
- Interactive controls:
  - Minimum target size `36x36`
  - Visible keyboard focus ring (`2px` solid `--brand-500` with offset)
- Icon-only actions require `aria-label`.

## 8) Motion

- Keep only:
  - Initial page stagger (`150-250ms`)
  - Hover lift up to `2px`
- Remove aggressive scale effects from dense tables/charts.
- Respect reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

## 9) Data Semantics

- Status color mapping (consistent across all widgets):
  - `Done/Closed/Paid`: `--success-500`
  - `In progress/Open`: `--brand-500`
  - `Review/Hold`: `--warning-500`
  - `Overdue/Expired/Unpaid`: `--danger-500`
- Never rely on color alone; include labels/icons.

## 10) File-by-File Implementation Plan

1. `src/app/globals.css`
- Add/replace tokens in section 4.
- Simplify `.card` hover effect (remove top glow strip).
- Add focus-visible rule and reduced motion rule.

2. `src/app/page.tsx`
- Reorder rows to the layout in section 3.
- Make top row 3 KPI cards only.
- Move `ClockWidget` into secondary actions row.

3. `src/components/dashboard/StatCard.tsx`
- Remove unused prop `color` (currently unused).
- Standardize sizing and text weights from section 5.
- Add `aria-label` if card is clickable.

4. `src/components/dashboard/ClockWidget.tsx`
- Replace tiny text button with standard action button.
- Improve label contrast.

5. `src/components/dashboard/ProjectsOverview.tsx`
- Replace mojibake icon (`ðŸ””`) with `lucide-react` icon.
- Convert tiny `10px` copy to `12px`.

6. `src/components/dashboard/TaskOverview.tsx`
- Replace mojibake arrows (`â†‘`, `â†“`) with proper icons.
- Reduce hover scaling in legend rows.

7. `src/components/dashboard/TeamMembers.tsx`
- Replace mojibake icon (`ðŸ‘¥`) with `Users` icon.
- Align card style with shared widget header pattern.

8. `src/components/dashboard/TicketStatus.tsx`
- Replace mojibake icon (`ðŸŽ«`) with `Ticket` icon.
- Expand truncated labels (`General Support`) on desktop.

## 11) Paste-Ready `page.tsx` Structure

Use this ordering in `src/app/page.tsx`:

```tsx
<div className="space-y-6">
  {/* 1. Primary KPI */}
  {/* 2. Secondary actions: Clock + Reminder */}
  {/* 3. Invoice + Income */}
  {/* 4. Timeline + Todo */}
  {/* 5. Supporting analytics */}
  {/* 6. Announcement */}
</div>
```

## 12) QA Checklist

- Desktop (1366px+): no overlap, clear visual hierarchy in under 5 seconds.
- Tablet (1024px): no cramped cards, no unreadable labels.
- Mobile (390px): top KPI and urgent actions visible without excessive scrolling.
- Keyboard: all actionable controls reachable, visible focus.
- Contrast: muted text still readable; key numbers clearly dominant.

## 13) Effort Estimate

- Phase 1 (token + layout + icon/contrast cleanup): `1.5 - 2.5` dev days.
- Phase 2 (chart clarity + deeper component unification): `1 - 2` dev days.
- Phase 3 (a11y hardening + visual polish): `0.5 - 1` dev day.
