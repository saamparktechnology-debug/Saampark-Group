# 🔌 Frontend-to-Backend Integration Guide

This document explains how the **Next.js frontend** communicates with the backend, where auth state is stored, and how headers are passed.

---

## 🔐 Authentication & Session Flow

The frontend manages user credentials and active company state using **Zustand** stores with `localStorage` persistence:

| State Store | Location in Frontend | Stored Information |
|---|---|---|
| `useAuthStore` | `src/store/useAuthStore.ts` | `user` object, `role`, `activeCompanyId`, `token` |
| `useTimerStore`| `src/store/useTimerStore.ts`| `isClockedIn`, `clockInTime`, `secondsElapsed` |
| `useUIStore`   | `src/store/useUIStore.ts`   | Modal states, theme, sidebar collapsed |

---

## 📡 API Client Configuration

When setting up Axios or Fetch on the frontend, use this base configuration:

```ts
// frontend/src/lib/api.ts
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
});

// Automatically inject JWT and Active Company ID in every request
api.interceptors.request.use((config) => {
  const { user, activeCompanyId } = useAuthStore.getState();

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  if (activeCompanyId) {
    config.headers["X-Company-Id"] = activeCompanyId;
  }

  return config;
});
```

---

## 🔄 Company Switching Mechanism

When a **Super Admin** or authorized user switches companies in the top-right profile dropdown:
1. `useAuthStore.getState().switchCompany("digital")` updates `activeCompanyId`.
2. React components (Dashboard, Clients table, Leads table) automatically re-render or re-fetch with `X-Company-Id: digital`.
3. Backend filters all database records by `company_id = 'digital'`.

---

## ⏱ Attendance / Clock-In Integration

1. When the user clicks **Clock In** on the dashboard:
   - Frontend calls `POST /api/v1/attendance/clock-in`
   - Store updates `isClockedIn = true` and starts local timer.
2. When the user clicks **Clock Out**:
   - Frontend calls `POST /api/v1/attendance/clock-out`
   - Store updates `isClockedIn = false` and resets timer.
