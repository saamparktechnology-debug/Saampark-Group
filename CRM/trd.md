# Technical Requirements Document (TRD)
## Project: SAAMPARK Group Enterprise CRM & Invoice Studio Remediation

**Document Version:** 1.0.0  
**Stack:** Next.js 14 (App Router) + Zustand + TypeScript | Express.js + Node.js | MySQL 8.0 (Raw SQL)

---

## 1. System Architecture & Tech Stack

```mermaid
graph TD
    subgraph Client Application (Next.js 14 / TypeScript)
        AppRouter[Next.js App Router / Pages]
        Components[UI Components & Document Studio]
        ZustandAuth[useAuthStore]
        ZustandPerm[usePermissionStore]
        StorageSyncLib[lib/storageSync.ts]
    end

    subgraph API & Gateway (Node.js / Express)
        AuthMiddleware[JWT & Role Verification]
        CompanyScope[Company Scope Isolation Middleware]
        CompController[controllers/companyController.js]
        BranchController[controllers/branchController.js]
        InvoiceController[controllers/salesController.js]
    end

    subgraph Database Layer (MySQL)
        MySQLPool[mysql2 Connection Pool]
        CompaniesTable[(companies Table)]
        BranchesTable[(branches Table)]
        InvoicesTable[(invoices Table)]
        AppDataTable[(app_data KV Table)]
    end

    Components <--> ZustandAuth
    Components <--> ZustandPerm
    ZustandAuth <--> StorageSyncLib
    ZustandAuth -->|Axios REST| AuthMiddleware
    AuthMiddleware --> CompanyScope
    CompanyScope --> CompController
    CompanyScope --> BranchController
    CompController --> MySQLPool
    BranchController --> MySQLPool
    MySQLPool --> CompaniesTable
    MySQLPool --> BranchesTable
    MySQLPool --> AppDataTable
```

---

## 2. In-Depth Technical Root Cause Analysis (Preview Persistence Defect)

The reported defect—*"fields changed, removed or moved in companies invoice preview section revert back to previous on save and refresh"*—is caused by four compounding architectural flaws across the frontend and backend:

### 2.1 Flaw 1: Frontend Destructive Overwrite in `loadData()`
- **Location:** `frontend/src/app/feature/companies/index.tsx` (Lines 406–432)
- **Mechanism:** When `loadData()` fetches company records from the API, it calculates `finalCompanies` by explicitly hardcoding property values over the database result:
```typescript
// Existing Destructive Code in index.tsx:
const finalCompanies: Company[] = [
  {
    ...CANONICAL_COMPANIES[0],
    ...rawTech,
    id: "tech",
    slug: "tech",
    brand_name: "SAAMPARK",               // <-- FORCED OVERWRITE ON REFRESH
    division_name: "TECHNOLOGY",           // <-- FORCED OVERWRITE ON REFRESH
    subtitle: "AND RESEARCH PRIVATE LIMITED", // <-- FORCED OVERWRITE ON REFRESH
    name: "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED", // <-- FORCED OVERWRITE
    logo_url: rawTech.logo_url || "/saampark-logo.png",
  },
  ...
]
```
- **Consequence:** Regardless of what the user changed and saved to the database, every browser reload or tab switch triggers `loadData()`, which wipes out the user's custom brand name, division, and subtitle.

---

### 2.2 Flaw 2: Backend Controller Whitelist Drop
- **Location:** `backend/src/controllers/companyController.js` (Lines 144–151)
- **Mechanism:** The `updateCompany` endpoint checks incoming request body attributes against a strict `allowedFields` array:
```javascript
// Existing allowedFields in companyController.js:
const allowedFields = [
  'name', 'currency', 'currency_symbol', 'logo_url', 'address', 'industry',
  'brand_name', 'division_name', 'subtitle', 'gstin', 'pan', 'cin', 'msme_reg', 'website',
  'signatory_name', 'signatory_designation', 'signature_image_url', 'stamp_image_url',
  'terms_conditions', 'invoice_notes', 'upi_id', 'account_holder', 'bank_name', 
  'account_number', 'ifsc_code', 'bank_branch', 'payment_qr_url',
  'gst_bank_name', 'gst_account_holder', 'gst_account_number', 'gst_ifsc_code', 
  'gst_bank_branch', 'gst_upi_id', 'gst_payment_qr_url',
  'nongst_bank_name', 'nongst_account_holder', 'nongst_account_number', 
  'nongst_ifsc_code', 'nongst_bank_branch', 'nongst_upi_id', 'nongst_payment_qr_url'
];
```
- **Consequence:** Studio positioning and customization fields (`signature_position`, `stamp_position`, `logo_scale`, `stamp_scale`, `signature_scale`, `custom_stamps`, `invoice_customization`, `iso_certification`) are **not** in `allowedFields`. The controller silently filters them out and does not write them to MySQL.

---

### 2.3 Flaw 3: MySQL Relational Schema Omission
- **Location:** `backend/database_provisioner.js` and production database tables
- **Mechanism:** The MySQL `companies` and `branches` tables lack columns for document customization and canvas coordinates.
- **Consequence:** Even if controllers accepted the payload, the SQL query would fail with `ER_BAD_FIELD_ERROR` unless appropriate JSON and scalar columns are provisioned.

---

### 2.4 Flaw 4: Missing Explicit "Field Removal" Tracking
- **Location:** `frontend/src/app/feature/sales/invoices/components/OfficialInvoiceDocument.tsx`
- **Mechanism:** Fields are rendered based on truthy checks:
```typescript
const fullRegisteredCompanyName = (
  companyDetails?.name || activeCompany?.name || "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED"
).trim()
```
- **Consequence:** If a user deletes the text in a field (e.g. setting `subtitle = ""`), the code evaluates `""` as falsy and falls back to system defaults. To support permanent field removal, an explicit `hidden_fields` set must be maintained.

---

## 3. Remediation Specifications

### 3.1 Database Migration Schema
Add dedicated JSON and configuration columns to `companies` and `branches`:

```sql
-- Migration: Add Document Studio & Layout Persistence Columns
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS iso_certification VARCHAR(255) NULL AFTER subtitle,
  ADD COLUMN IF NOT EXISTS signature_position JSON NULL AFTER signature_image_url,
  ADD COLUMN IF NOT EXISTS stamp_position JSON NULL AFTER stamp_image_url,
  ADD COLUMN IF NOT EXISTS logo_position JSON NULL AFTER logo_url,
  ADD COLUMN IF NOT EXISTS logo_scale DECIMAL(3,2) DEFAULT 1.00 AFTER logo_position,
  ADD COLUMN IF NOT EXISTS stamp_scale DECIMAL(3,2) DEFAULT 1.00 AFTER stamp_position,
  ADD COLUMN IF NOT EXISTS signature_scale DECIMAL(3,2) DEFAULT 1.00 AFTER signature_position,
  ADD COLUMN IF NOT EXISTS custom_stamps JSON NULL,
  ADD COLUMN IF NOT EXISTS invoice_customization JSON NULL;

ALTER TABLE branches 
  ADD COLUMN IF NOT EXISTS signature_position JSON NULL,
  ADD COLUMN IF NOT EXISTS stamp_position JSON NULL,
  ADD COLUMN IF NOT EXISTS logo_scale DECIMAL(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS stamp_scale DECIMAL(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS signature_scale DECIMAL(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS custom_stamps JSON NULL,
  ADD COLUMN IF NOT EXISTS invoice_customization JSON NULL;
```

---

### 3.2 Backend Controller Updates
Update `backend/src/controllers/companyController.js` and `branchController.js` to whitelist all studio fields and handle JSON serialization/deserialization safely:

```javascript
// Whitelist expansion:
const studioFields = [
  'iso_certification',
  'signature_position',
  'stamp_position',
  'logo_position',
  'logo_scale',
  'stamp_scale',
  'signature_scale',
  'custom_stamps',
  'invoice_customization'
];
const allowedFields = [...standardFields, ...studioFields];

// In update handler:
for (const field of allowedFields) {
  if (req.body[field] !== undefined) {
    fields.push(`${field} = ?`);
    let val = req.body[field];
    if (typeof val === 'object' && val !== null) {
      val = JSON.stringify(val);
    } else if (val === '') {
      val = null;
    }
    values.push(val);
  }
}
```

---

### 3.3 Frontend Hydration & Merge Remediation
In `frontend/src/app/feature/companies/index.tsx`, refactor `loadData()` to preserve all database values directly:

```typescript
// Fixed loadData() logic:
const finalCompanies = rawCompaniesFromDB.map(dbComp => {
  return {
    ...dbComp,
    // Safely parse JSON properties if returned as strings
    signature_position: typeof dbComp.signature_position === 'string' 
      ? JSON.parse(dbComp.signature_position) 
      : (dbComp.signature_position || { x: 0, y: 0 }),
    stamp_position: typeof dbComp.stamp_position === 'string' 
      ? JSON.parse(dbComp.stamp_position) 
      : (dbComp.stamp_position || { x: 0, y: 0 }),
    custom_stamps: typeof dbComp.custom_stamps === 'string' 
      ? JSON.parse(dbComp.custom_stamps) 
      : (Array.isArray(dbComp.custom_stamps) ? dbComp.custom_stamps : []),
    invoice_customization: typeof dbComp.invoice_customization === 'string' 
      ? JSON.parse(dbComp.invoice_customization) 
      : (dbComp.invoice_customization || { hidden_fields: [] }),
    // DO NOT override brand_name, division_name, or subtitle with hardcoded strings!
    brand_name: dbComp.brand_name ?? "SAAMPARK",
    division_name: dbComp.division_name ?? "",
    subtitle: dbComp.subtitle ?? "",
    name: dbComp.name ?? "SAAMPARK",
  }
})
```

---

## 4. API Endpoints & Data Contracts

### 4.1 Update Company Profile & Layout
- **Endpoint:** `PUT /api/companies/:id`
- **Headers:** `Authorization: Bearer <jwt_token>`, `Content-Type: application/json`
- **Request Payload:**
```json
{
  "name": "SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED",
  "brand_name": "SAAMPARK",
  "division_name": "TECHNOLOGY & AI",
  "subtitle": "Center for Advanced Computing",
  "iso_certification": "An ISO 9001:2015 Certified Company",
  "cin": "U72900WB2026PTC123456",
  "gstin": "19AAECS1234F1Z8",
  "pan": "AAECS1234F",
  "signature_position": { "x": 140, "y": -25 },
  "stamp_position": { "x": 50, "y": 15 },
  "logo_scale": 1.25,
  "stamp_scale": 1.10,
  "signature_scale": 1.05,
  "custom_stamps": [
    {
      "id": "stamp-paid-1",
      "text": "PAID IN FULL",
      "color": "#0d9488",
      "rotation": -12,
      "fontSize": 14,
      "bgStyle": "stamp",
      "x": 220,
      "y": 480
    }
  ],
  "invoice_customization": {
    "hidden_fields": ["msme_reg"],
    "preview_invoice_type": "gst"
  }
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Company updated successfully",
  "data": {
    "id": 1,
    "slug": "tech"
  }
}
```

---

## 5. Security, Validation & Concurrency

1. **Role Guarding:** Updating company layout and corporate branding requires `SUPER_ADMIN` or `ADMIN` role. Regular staff and clients receive `403 Forbidden`.
2. **Payload Sanitization:** String inputs undergo sanitization against script injection (`<script>` removal). JSON payloads are schema-validated to prevent arbitrary DB injection.
3. **Atomic Transactions:** Company updates and audit log entries execute inside single database transactions (`conn.beginTransaction()`), guaranteeing zero partial state corruptions.
