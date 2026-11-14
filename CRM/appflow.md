# Application Flow & Data Architecture (Appflow)
## Project: SAAMPARK Group Enterprise CRM

**Document Version:** 1.0.0  
**Scope:** Navigation Paths, User Journeys, State Synchronization Lifecycle, and Studio Data Pipelines

---

## 1. System Navigation & High-Level Architecture Flow

```mermaid
flowchart TD
    Login[Authentication & Session Check] --> Guard{Role & Company Scope}
    
    Guard -->|Super Admin| GlobalDashboard[Global Multi-Company Dashboard]
    Guard -->|Company Admin| CompanyDashboard[Company Scoped Dashboard]
    Guard -->|Branch / Staff| StaffWorkspace[Assigned Branch & Workflows]
    Guard -->|Client| ClientPortal[Client Invoice & Project Hub]

    GlobalDashboard --> CompaniesModule[Companies & Branches Studio]
    GlobalDashboard --> SystemSettings[Module Permissions & System Config]
    
    CompanyDashboard --> SalesHub[Sales & Financial Hub]
    CompanyDashboard --> HRHub[HR & Attendance Hub]
    CompanyDashboard --> CRMHub[Leads & Clients Directory]

    SalesHub --> Invoices[Invoices: GST / Non-GST]
    SalesHub --> Quotations[Quotations & Estimates]
    SalesHub --> Payments[Payment Receipts & Banking]

    CompaniesModule --> SplitStudio[Company Split-Screen Studio Modal]
    SplitStudio --> FormPane[Left: Corporate Credentials & Bank Config]
    SplitStudio --> LiveCanvas[Right: WYSIWYG A4 Live Invoice Canvas]
```

---

## 2. Detailed Journey: Company Management & Invoice Preview Studio

### 2.1 The Issue: Current Broken Flow vs. Target Fixed Flow

#### Broken Flow (Current State):
```mermaid
sequenceDiagram
    autonumber
    actor User as Corporate Admin
    participant Canvas as Live Preview Canvas
    participant Modal as CompanyModal State
    participant API as CompanyApiService (REST)
    participant Backend as Express Controller
    participant DB as MySQL DB
    participant Hydration as loadData() on Refresh

    User->>Canvas: Drags Signature to (X: 120, Y: -40)
    User->>Canvas: Edits Subtitle & Deletes CIN Field
    Canvas->>Modal: Updates companyForm & local position state
    User->>Modal: Clicks "Save Preview"
    Modal->>API: PUT /api/companies/tech (payload with positions)
    API->>Backend: PUT /api/companies/:id
    Note over Backend: allowedFields drops signature_position & custom_stamps!<br/>MySQL UPDATE only writes whitelisted text columns
    Backend->>DB: UPDATE companies (layout coordinates dropped)
    Backend-->>API: 200 Success Response
    Modal-->>User: "Saved Successfully" Toast
    Note over User,Hydration: User presses Refresh (F5 / reload)
    User->>Hydration: Page reloads -> loadData() executes
    Note over Hydration: CANONICAL_COMPANIES hardcoded merge:<br/>subtitle = "AND RESEARCH PRIVATE LIMITED"<br/>positions reset to (0, 0)<br/>deleted fields restored!
    Hydration-->>Canvas: Canvas resets to default hardcoded view!
```

#### Remediation Flow (Target Production Architecture):
```mermaid
sequenceDiagram
    autonumber
    actor User as Corporate Admin
    participant Canvas as Live Preview Canvas
    participant Modal as CompanyModal State
    participant Store as useAuthStore (Zustand)
    participant Sync as storageSync (IndexedDB / Local)
    participant API as CompanyApiService (REST)
    participant Backend as Express Controller
    participant DB as MySQL Database

    User->>Canvas: Drags Stamp / Signature, removes CIN, changes text
    Canvas->>Modal: Real-time coordinate & visibility tracking
    User->>Modal: Clicks "Save Preview"
    Modal->>API: PUT /api/companies/:id (with invoice_customization JSON)
    API->>Backend: Validates & unpacks payload
    Backend->>DB: Stores raw fields + invoice_customization JSON block
    DB-->>Backend: Confirmed commit
    Backend-->>API: 200 OK (returns updated company record with layout)
    Modal->>Store: updateCompany(id, returnedRecord)
    Modal->>Sync: saveModuleDataToDB("companies", updatedList)
    Modal-->>User: Visual success confirmation indicator
    
    Note over User,DB: User refreshes page (F5 / hard reload)
    User->>Modal: Page loads -> loadData() runs
    Modal->>API: GET /api/companies
    API->>DB: SELECT * FROM companies
    DB-->>API: Returns persisted record with custom layout JSON
    API-->>Modal: Clean database entities (NO hardcoded destructive overwrite)
    Modal->>Canvas: Restores exact coordinates, hidden fields & custom stamps!
```

---

## 3. Multi-Tier Entity Inheritance & Fallback Flow

In SAAMPARK CRM, documents can be issued by a **Parent Company**, an **Operational Branch**, or a **Franchise Sub-Branch**. The system resolves branding and banking credentials using strict hierarchical precedence:

```mermaid
flowchart TD
    Start[Invoice Issued by Entity] --> CheckEntity{Entity Level?}
    
    CheckEntity -->|Sub-Branch / Partner| SubBranchLevel[Sub-Branch Config]
    CheckEntity -->|Branch Office| BranchLevel[Branch Config]
    CheckEntity -->|Headquarters| CompanyLevel[Company Master Profile]

    SubBranchLevel --> SBLogo{Has Custom Logo?}
    SBLogo -->|Yes| UseSBLogo[Use Sub-Branch Logo]
    SBLogo -->|No| CheckBranchLogo{Parent Branch Has Logo?}
    CheckBranchLogo -->|Yes| UseBranchLogo[Use Branch Logo]
    CheckBranchLogo -->|No| UseCompLogo[Use Master Company Logo]

    SubBranchLevel --> SBBank{Has Regional Bank?}
    SBBank -->|Yes| UseSBBank[Use Sub-Branch Bank Profile & QR]
    SBBank -->|No| UseParentBank[Inherit Parent Branch / Company Bank & QR]

    SubBranchLevel --> SBSig{Has Manager Stamp/Sig?}
    SBSig -->|Yes| UseSBSig[Use Sub-Branch Manager Signature]
    SBSig -->|No| UseCompSig[Inherit Company Authorized Signatory]
```

### Inheritance Priority Rules:
1. **Logo & Identity:** `Sub-Branch Override` > `Branch Override` > `Company Master`
2. **Tax & Legal IDs:** Sub-Branches display their parent branch/company GSTIN & PAN unless registered as an independent corporate entity.
3. **Banking & UPI:** Invoices automatically bind to the specified **GST Bank Profile** (if tax > 0%) or **Non-GST Bank Profile** (if 0% tax), cascading from Sub-Branch -> Branch -> Company.
4. **Signatures & Seal:** If a branch manager's stamp/signature is uploaded, it takes precedence on local branch invoices; otherwise, the corporate managing director signature applies.

---

## 4. Sales Pipeline & Document Lifecycle Flow

```mermaid
stateDiagram-v2
    [*] --> LeadCreated: Incoming Enquiry / Lead
    LeadCreated --> ProposalSent: Proposal / Quotation Generated
    ProposalSent --> Negotiation: Client Review
    Negotiation --> OrderConfirmed: Deal Won / Sales Order
    OrderConfirmed --> InvoiceDraft: Generate Invoice (GST / Non-GST)
    InvoiceDraft --> InvoiceStudio: Preview & Document Studio Calibration
    InvoiceStudio --> InvoiceIssued: Final Issuance (PDF / WhatsApp / Email)
    InvoiceIssued --> PartialPayment: Partial Payment Logged
    InvoiceIssued --> PaidFull: Paid in Full (Auto-generate Receipt)
    PartialPayment --> PaidFull: Final Balance Settled
    PaidFull --> [*]
```

---

## 5. State Synchronization & Persistence Architecture

The platform combines a tripartite state model to ensure offline-readiness, cross-tab synchronization, and server-side truth:

```mermaid
graph LR
    subgraph Browser Client
        LocalUI[Component UI State] <--> Zustand[useAuthStore & usePermissionStore]
        Zustand <--> StorageSync[IndexedDB / LocalStorage Sync]
    end

    subgraph REST API & Network
        Zustand --> Axios[Axios API Client]
        Axios --> Express[Express.js Middleware & Controllers]
    end

    subgraph Persistence Layer
        Express --> Pool[MySQL2 Connection Pool]
        Pool --> MySQL[(saampark_crm MySQL DB)]
        Express --> AppData[(app_data Fallback KV Table)]
    end
```

### Synchronization Sequence:
1. **Component Modification:** Inline text typing or drag events update local component state immediately for zero-latency 60 FPS visual feedback.
2. **Debounced / Explicit Save:** Clicking "Save Preview" or "Save Company" packages the full entity document state.
3. **Primary Persistence:** Dispatches `PUT /api/companies/:id` to Express backend and persists to MySQL relational tables.
4. **Secondary Cache Sync:** Dispatches `saveModuleDataToDB("companies", list)` to the fast KV table `app_data` and updates Zustand memory.
5. **Cross-Tab Event Dispatch:** Fires `window.dispatchEvent(new CustomEvent('saampark_company_updated'))` and `storage` events to ensure all open CRM tabs synchronize their invoice headers instantly.
