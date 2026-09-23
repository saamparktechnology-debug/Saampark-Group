# Live Invoice Interactive Studio & Custom Text Engine

## Overview of Changes

We enhanced the **Split-Screen Studio** across Company, Branch, and Sub-Branch modals, enabling full WYSIWYG live editing with bidirectional state binding and an interactive **Custom Draggable Text & Stamp Engine**.

---

### 1. Direct Field Editing & Persistent Saving

When typing directly on the live invoice preview canvas, the changes instantly update the underlying form state (`companyForm`, `branchForm`, or `subBranchForm`) and persist to the database and global store upon saving:

- **Legal & Tax Identification**:
  - `GSTIN` (e.g. `19AAECS1234F1Z8`)
  - `PAN` (e.g. `AAECS1234F`)
  - `CIN` (e.g. `U72200WB2020PTC123456`)
- **Entity Identity & Branding**:
  - Full Registered Corporate Name
  - Subtitle / Tagline
  - ISO Certification Badge
- **Contact & Location**:
  - Office Address
  - Phone Number
  - Email Address
  - Official Website URL
- **Banking & Digital Signatures**:
  - Bank Name, Account Number, IFSC Code, Account Holder Name, Bank Branch, and UPI ID
  - Authorized Signatory Name & Designation
  - Terms & Conditions and Invoice Notes

---

### 2. Custom Draggable Text & Stamp Engine

Users can now add, drag, edit, zoom, and customize text notes, stickers, watermarks, and stamps directly onto the invoice canvas:

- **Add Text / Stamp Buttons**:
  - `+ Text Note`: Adds a customizable draggable badge.
  - `+ PAID Stamp`: Adds a classic emerald green rubber stamp.
  - `+ SEAL Stamp`: Adds an official corporate seal stamp.
  - `+ CONFIDENTIAL`: Adds a crimson red high-priority stamp.
- **Draggable Positioning**:
  - Smooth, unrestricted dragging anywhere on the page with Framer Motion.
- **In-Place Live Editing**:
  - Touch/click inside any custom stamp to type and edit its text directly on the canvas.
- **Micro-Toolbar on Hover**:
  - **Zoom Text Size**: `A-` (decrease font size) and `A+` (increase font size from 8px up to 48px).
  - **Color Palette**: Quick color swatches (Teal `#0d9488`, Crimson `#dc2626`, Royal Blue `#2563eb`, Amber `#d97706`, Purple `#7c3aed`, Dark Slate `#18181b`).
  - **Rotation**: Angle cycler button (`0°`, `-12°`, `-24°`, `15°`, `45°`).
  - **Style Presets**: Toggle between `Stamp` (double dashed border), `Badge` (pill container), `Watermark` (large semi-transparent background overlay), and `Clean` (borderless transparent text).
  - **Delete Button (`✕`)**: One-click removal of any custom text sticker.

---

### 3. Verification & Quality

- **TypeScript Compilation**: `npx tsc --noEmit` passed with **0 errors**.
- **Responsive & Print-Safe**: All styles respect print media rules for clean A4 exports.
