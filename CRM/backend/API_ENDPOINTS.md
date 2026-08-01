# 📡 REST API Endpoints Specification

All endpoints are prefixed with `/api/v1`.

### 🔑 Authentication Headers
Except for `/auth/login`, all endpoints require:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
X-Company-Id: comp_tech_01
```

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "email": "superadmin@saampark.in",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_01",
      "email": "superadmin@saampark.in",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "Super Admin",
      "companyId": "comp_tech_01"
    },
    "availableCompanies": [
      { "id": "tech", "name": "SAAMPARK Technology" },
      { "id": "digital", "name": "SAAMPARK Digital Marketing & Research" }
    ]
  }
  ```

### `GET /auth/me`
Returns current user profile and session permissions.

### `POST /auth/switch-company`
Switches active company for Super Admins.
- **Request Body**: `{ "companyId": "digital" }`

---

## 2. Dashboard & Analytics (`/dashboard`)

### `GET /dashboard/overview`
Returns the KPI counts and aggregated chart data for the dashboard.
- **Query Params**: `?companyId=tech`
- **Response (200 OK)**:
  ```json
  {
    "kpi": {
      "clockInStatus": "Clocked Out",
      "openTasks": 46,
      "eventsToday": 1,
      "totalDue": "₹8,616.00"
    },
    "projectsOverview": {
      "open": 24,
      "completed": 6,
      "hold": 0,
      "progression": 31
    },
    "invoiceOverview": {
      "totalInvoiced": "₹26,446.00",
      "due": "₹8,616.00",
      "breakdown": [
        { "label": "Overdue", "count": 5, "amount": "₹2,648.50" },
        { "label": "Not paid", "count": 5, "amount": "₹3,256.00" },
        { "label": "Partially paid", "count": 9, "amount": "₹10,720.00" },
        { "label": "Fully paid", "count": 11, "amount": "₹12,470.00" },
        { "label": "Draft", "count": 1, "amount": "₹120.00" }
      ]
    },
    "tasksOverview": {
      "todo": 78,
      "inProgress": 61,
      "review": 68,
      "done": 169,
      "expired": 134
    }
  }
  ```

---

## 3. Clients (`/clients`)

### `GET /clients`
- **Query Params**: `?search=Acme&status=Active&page=1&limit=20`
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "CLI-001",
        "name": "Acme Corp",
        "email": "contact@acmecorp.com",
        "status": "Active",
        "projectsCount": 4,
        "totalRevenue": "₹35,00,000"
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20 }
  }
  ```

### `POST /clients`
Create a new client.
- **Request Body**:
  ```json
  {
    "name": "Acme Corp",
    "email": "contact@acmecorp.com",
    "phone": "+91 98765 43210",
    "status": "Active",
    "address": "Mumbai, Maharashtra"
  }
  ```

### `PATCH /clients/:id`
Update client details.

### `DELETE /clients/:id`
Delete or soft-delete a client.

---

## 4. Leads (`/leads`)

### `GET /leads`
- **Query Params**: `?status=Discussion&ownerId=usr_02`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "L-1",
      "name": "Rice-Wolf Industries",
      "primaryContact": "Luciano Schaefer",
      "phone": "+91 97800 34460",
      "owner": { "id": "usr_02", "name": "Sara Ann" },
      "value": "₹4,20,000",
      "status": "Negotiation",
      "createdAt": "2026-07-31"
    }
  ]
  ```

### `PATCH /leads/:id/status`
Used for Kanban drag-and-drop status changes.
- **Request Body**: `{ "status": "Won" }`

---

## 5. Attendance & Clock-In (`/attendance`)

### `POST /attendance/clock-in`
Starts the clock for the authenticated employee.
- **Request Body**: `{ "note": "Starting morning shift" }`
- **Response (200 OK)**:
  ```json
  {
    "id": "att_123",
    "clockInTime": "2026-08-01T09:00:00Z",
    "isClockedIn": true
  }
  ```

### `POST /attendance/clock-out`
Stops the clock and records duration.
- **Response (200 OK)**:
  ```json
  {
    "id": "att_123",
    "clockOutTime": "2026-08-01T17:30:00Z",
    "totalSeconds": 30600,
    "isClockedIn": false
  }
  ```

### `GET /attendance/status`
Returns whether the current user is currently clocked in.

---

## 6. Projects & Tasks (`/projects` & `/tasks`)

### `GET /projects`
Returns project list with progress percentages.

### `GET /tasks`
- **Query Params**: `?projectId=proj_01&status=In_progress&assignedTo=me`

### `POST /tasks`
Creates a task.
- **Request Body**:
  ```json
  {
    "title": "Build landing page",
    "projectId": "proj_01",
    "assignedTo": "usr_02",
    "priority": "High",
    "deadline": "2026-08-15"
  }
  ```
