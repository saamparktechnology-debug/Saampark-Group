# UI / UX Specification (UI-Spec)
## Project: SAAMPARK Group Enterprise CRM & Live Document Studio

**Document Version:** 1.0.0  
**Design Paradigm:** Premium Enterprise Dark/Light Mode, Glassmorphic Modals, WYSIWYG A4 Studio  
**Frameworks:** Tailwind CSS, Framer Motion, Lucide Icons, Vanilla CSS Design Tokens

---

## 1. Design System & Visual Foundation

### 1.1 Color Palette & Token Definitions
The platform uses a modern HSL-tailored color architecture supporting seamless Dark and Light themes with high contrast ratios (WCAG 2.1 AA compliant).

```
Theme Tokens:
├── Background:
│   ├── Light: #f8fafc (zinc-50 / slate-50 neutral base)
│   └── Dark:  #09090b (deep obsidian zinc-950)
├── Surface:
│   ├── Light: #ffffff (crisp clean cards)
│   └── Dark:  #121215 (subtle elevate zinc-900 with 1px border)
├── Primary Brand Accent:
│   ├── Light: #2563eb (Royal Blue) / #0d9488 (Teal Green)
│   └── Dark:  #3b82f6 (Vibrant Electric Blue) / #14b8a6 (Teal)
├── Secondary & Muted:
│   ├── Light: #64748b (slate-500)
│   └── Dark:  #a1a1aa (zinc-400)
└── Border & Dividers:
│   ├── Light: rgba(226, 232, 240, 0.8)
│   └── Dark:  rgba(39, 39, 42, 0.6)
```

### 1.2 Typography & Hierarchy
- **Primary Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Monospace Font Family:** `JetBrains Mono`, `Fira Code`, `ui-monospace`, `monospace` (used for Invoice Numbers, GSTIN, PAN, Bank Accounts, and coordinates)

| Scale | Size (Desktop) | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 24px - 28px | 900 (Black) | 1.15 | Page / Corporate Titles |
| `h1` | 18px - 20px | 800 (ExtraBold) | 1.25 | Modal Headings, Document Headers |
| `h2` | 15px - 16px | 700 (Bold) | 1.35 | Section Headers, Tab Titles |
| `body` | 13px - 14px | 500 (Medium) | 1.5 | General UI, Table rows, descriptions |
| `caption` | 10px - 11px | 600 (SemiBold) | 1.4 | Badges, Helper labels, metadata |
| `mono-code` | 11px - 12px | 700 (Bold) | 1.2 | GSTIN, CIN, Bank Accounts, coordinates |

---

## 2. Layout Framework & Navigation Components

### 2.1 Global App Shell
- **Dynamic Topbar:** Shows the active company badge, quick switcher (`Saampark Technology`, `Saampark Consultancy`), global notifications bell with unread badge count, current branch indicator, and user profile avatar.
- **Collapsible Sidebar:** Groups all 40+ enterprise features under clean logical categories (Core Management, Sales & Billing, Human Resources, CRM & Pipeline, Automation & Settings).
- **Feedback Banner & Toast System:** Non-blocking top-center feedback toasts triggered by `executeWithFeedback` showing animated loaders, success confirmations, or error alerts.

---

## 3. Split-Screen Studio Modal (Company / Branch / Sub-Branch)

The **Document Studio Modal** provides an interactive split-screen environment allowing side-by-side editing of configuration parameters and real-time live preview rendering.

```
+-----------------------------------------------------------------------------------------+
| [🏢] Edit Company: SAAMPARK TECHNOLOGY                     [Split] [Form] [Preview]  [✕]|
+-------------------------------------------------------------+---------------------------+
| LEFT PANE: Form Controls (45% Width)                        | RIGHT PANE: Studio Canvas |
| [1. Brand] [2. Stamps] [3. Tax] [4. Contact] [5. Bank] [6.SMTP]| [A-] [A+] [🎨] [🔄] [Save]|
|                                                             |                           |
| Main Brand Name *       Division / Business Unit (Opt)      | +-----------------------+ |
| [ SAAMPARK            ] [ TECHNOLOGY                  ]     | | SAAMPARK TECHNOLOGY   | |
|                                                             | | Research & Innovation | |
| Corporate Subtitle / Tagline                                | | GSTIN: 19AAECS1234F1Z8| |
| [ AND RESEARCH PRIVATE LIMITED                        ]     | |                       | |
|                                                             | | Bill To: Acme Corp    | |
| Corporate Logo Upload                                       | | Total: ₹17,700        | |
| [ Drag & drop image / Browse file                     ]     | |                       | |
|                                                             | | [SEAL]       [Sign]   | |
| Dual Banking Profiles:                                      | | (X:120,Y:40) (Scale:1)| |
| [● GST Banking Profile] [○ Non-GST Banking Profile]         | +-----------------------+ |
| Bank Name: [ HDFC Bank                              ]       | Zoom: [-] 100% [+]        |
| Account No: [ 50200012345678                         ]       | Drag coordinates indicator|
|                                                             +---------------------------+
| [ Cancel ]                                                  | [ Save Preview Changes ]  |
+-------------------------------------------------------------+---------------------------+
```

### 3.1 Modal Header & View Mode Switcher
1. **Split Screen (`split`):** Side-by-side layout (45% left form controls, 55% right live canvas). Default on viewports ≥ 1280px.
2. **Form Only (`form`):** Full-width single-column view optimized for fast data entry on smaller displays or laptops.
3. **Preview Only (`preview`):** Maximized live canvas studio (100% modal width) for detailed typography and placement calibration.

---

## 4. Live A4 Invoice Canvas Specification

### 4.1 Canvas Dimensions & Coordinate Model
- **Canvas Container:** Strictly calibrated to A4 paper ratio (`1 : 1.414`). At default scale (`100%`), container renders at `800px` width with natural print page height.
- **Zoom Slider:** Allows scaling canvas smoothly from `60%` to `140%` without altering printed document dimensions.
- **Coordinate Origins:**
  - Signature and Stamp offsets (`x, y`) are tracked in relative CSS pixels from their baseline anchors inside the signatory container.
  - Coordinate indicators display in real-time in the studio status bar: `Sig: X:120 Y:-35 | Stamp: X:45 Y:10`.

### 4.2 Interactive Direct Inline Text Editing
- Any text element wrapped in `<EditableText />` features a subtle hover ring (`hover:bg-blue-100/70 hover:ring-1 hover:ring-blue-400`).
- **Click-to-Focus:** Clicking focuses the contentEditable element, elevating contrast (`focus:bg-white focus:text-zinc-950 focus:ring-2 focus:ring-blue-600`).
- **Keyboard Traps:** Pressing `Enter` automatically commits the change, blurs the element, and propagates the value to the parent form state.

### 4.3 Field Visibility & Removal UI
- **Field Hover Micro-Action:** When hovering over optional metadata fields (CIN, GSTIN, PAN, ISO certification badge, division subtitle, website, phone), an action badge appears:
  - `✕ Remove Field`: Clicking explicitly hides the field, setting its visibility flag to `hidden` in `invoice_customization.hidden_fields`.
  - The canvas instantly reflows without the deleted element.
  - The hidden status is preserved permanently upon saving.
- **Restore Hidden Fields Drawer:** A collapsible tray at the top of the canvas displays currently hidden fields with a `+ Restore [Field Name]` chip.

### 4.4 Draggable Custom Text & Stamp Engine
Floating micro-toolbar positioned directly above active stamps:
```
+--------------------------------------------------------------+
| [A-] [A+] | [● Teal] [● Red] [● Blue] [● Amber] | [🔄 0°] | [✕]|
+--------------------------------------------------------------+
|                        PAID                                  |
+--------------------------------------------------------------+
```
- **Size Controls:** `A-` (decrease font by 2px) / `A+` (increase font by 2px, min 8px, max 48px).
- **Color Palette:** 6 curated ink swatches (Emerald Teal `#0d9488`, Crimson `#dc2626`, Royal Blue `#2563eb`, Warm Amber `#d97706`, Violet `#7c3aed`, Obsidian `#18181b`).
- **Angle Cycler (`🔄`):** Cycles through standard stamp orientations: `0°`, `-12°`, `-24°`, `+15°`, `+45°`.
- **Border Style Selector:** Toggle between:
  - `Stamp`: Classic double-line rubber stamp border.
  - `Badge`: Solid rounded pill badge.
  - `Watermark`: Large semi-transparent background overlay (opacity 0.15).
  - `Clean`: Transparent borderless text.
- **One-Click Delete (`✕`):** Instantly purges the stamp from the array.

---

## 5. Responsive Behavior & Print Media Specifications

### 5.1 Responsive Breakpoints
| Viewport | Mode Behavior |
|---|---|
| `< 768px` (Mobile) | Forces `form` view. Studio canvas accessible via a "Preview Document" bottom bar sheet. |
| `768px - 1279px` (Tablet / Laptop) | Defaults to `form` view with tabbed switcher to toggle full-width `preview`. |
| `≥ 1280px` (Desktop / Large Displays) | Defaults to `split` screen studio view. |

### 5.2 Print Media Rules (`@media print`)
When generating PDFs or triggering browser print (`Ctrl+P`):
- All studio controls, drag handles, zoom sliders, hover rings, and borders are hidden (`display: none !important`).
- Background colors, images, and SVG icons are forced visible (`-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`).
- Margins are set to standard `0.5in` / `12mm` with strict page-break avoidance inside table rows and signature blocks.
