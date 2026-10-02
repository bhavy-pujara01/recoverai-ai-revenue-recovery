# RecoverAI — Intelligent Payment Revenue Recovery Platform

[![Production Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](https://recoverai.in)
[![Engine](https://img.shields.io/badge/Engine-Deterministic%20AI%20v2.4-blue.svg)](https://recoverai.in)
[![License](https://img.shields.io/badge/License-MIT-slate.svg)](LICENSE)

**RecoverAI** is an autonomous, explainable payment revenue recovery and checkout win-back platform built for high-growth Indian fintech and SaaS organizations. It captures gateway timeouts, issuer declines, 3DS authentication drop-offs, and lapsed eNACH mandates, and applies deterministic scoring to orchestrate high-conversion recovery sequences via interactive WhatsApp deep-links, telecom SMS fallbacks, and smart acquirer retries.

---

## ⚡ Key Highlights

- **Explainable Recovery Intelligence Engine**: Deterministic calculation of recovery probabilities, priority scores (CRITICAL / HIGH / MEDIUM / LOW), expected recovery amounts (₹), and human-readable diagnostic rationales without black-box opacity.
- **Interactive Multi-Channel Routing**: Smart auto-retries timed with issuer bank clearing windows, 1-click WhatsApp UPI Intent deep-links (88%+ open rate), SMS fallback links, and digital mandate re-authorization prompts.
- **Complete End-to-End Workflow**:
  $$\text{Failed Payment} \rightarrow \text{Diagnostic Classification} \rightarrow \text{Deterministic AI Scoring} \rightarrow \text{Explainability Log} \rightarrow \text{Targeted Recovery Dispatch} \rightarrow \text{Ledger Settlement} \rightarrow \text{Audit Trail} \rightarrow \text{Live Notification}$$
- **Targeted Recovery Campaigns**: Multi-step recovery sequences with audience segmentation (Enterprise, Mid-Market, SME, Retail), threshold filters, delay scheduling, and real-time conversion tracking.
- **Enterprise RBAC & Security**: Strict role-based authorization (`ADMIN`, `ANALYST`, `SUPPORT`), bcrypt password hashing, signed JWT authentication, and tamper-evident audit logging.
- **Real-Time Analytics & Cohorts**: Gross failed vs. recovered revenue trends, root-cause distribution, channel conversion rates, and payment instrument resolution efficiency.
- **Simulate / Live Injection Console**: Built-in interactive test tool allowing operators to inject simulated gateway failures and verify recovery pipelines instantly.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Vanilla Tailwind CSS with clean fintech design system (Plus Jakarta Sans & JetBrains Mono typography)
- **Icons & Visuals**: Lucide React Icons & Recharts Visualization Suite
- **State & Routing**: React Router v6, React Context API, Axios with interceptors

### Backend
- **Runtime**: Node.js & Express.js REST API
- **ORM & Database**: Prisma ORM with SQLite (zero-config local development) and PostgreSQL / Neon cloud compatibility
- **Security**: JWT Authentication, bcryptjs, Helmet, CORS
- **Testing**: Node.js Native Test Suite (13 passing unit and integration tests)

---

## 🔑 Demo Credentials

Use the **1-Click Demo Login** buttons on the login page or enter credentials manually:

| Persona | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@recoverai.in` | `Admin@123` | Full administrative control, team invitations, webhook secrets, settings |
| **📊 Analyst** | `analyst@recoverai.in` | `Analyst@123` | Campaign creation & execution, analytics, recovery dispatch |
| **🎧 Support** | `support@recoverai.in` | `Support@123` | Transaction inspection, customer support recovery execution |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js `v18+` (Tested on Node `v24`)
- npm `v9+`

### 2. Clone & Install Dependencies
```bash
# Clone repository
git clone https://github.com/your-org/recoverai.git
cd recoverai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Initialize & Seed Database
```bash
cd ../backend

# Generate Prisma Client & push schema
npx prisma generate
npx prisma db push

# Seed database with realistic Indian Fintech datasets
node prisma/seed.js
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd backend
node src/index.js

# Terminal 2: Frontend Client (Port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run the complete test suite covering the deterministic Recovery Engine and all REST APIs:

```bash
cd backend
npm test
```

Or from project root:
```bash
node --test tests/unit/recoveryEngine.test.js tests/integration/api.test.js
```

---

## 📊 Core Architecture & API Endpoints

```
recoverai/
├── backend/
│   ├── src/
│   │   ├── config/ (Prisma singleton, env configs)
│   │   ├── controllers/ (Auth, Transactions, Customers, Campaigns, Analytics, Settings, Notifications, Audit)
│   │   ├── middleware/ (JWT Auth, RBAC Role Guard, Error Handler)
│   │   ├── routes/ (REST API routers)
│   │   ├── services/ (Deterministic Recovery Engine, Simulation Engine, Audit & Notification dispatchers)
│   │   └── index.js (Express server bootstrap)
│   └── prisma/
│       ├── schema.prisma (Data models & relations)
│       └── seed.js (Realistic Indian Fintech seed data)
├── frontend/
│   ├── src/
│   │   ├── api/ (Axios client & typed endpoints)
│   │   ├── components/
│   │   │   ├── common/ (Button, Badge, Modal, Card, StatCard, Tabs, Pagination, Skeleton, EmptyState)
│   │   │   ├── layout/ (DashboardLayout, Sidebar, Navbar, NotificationDropdown, UserMenu)
│   │   │   ├── recovery/ (ExplainabilityCard, RecoveryTimeline, ActionModal, BatchActionModal, SimulateTxnModal)
│   │   │   └── charts/ (RevenueRecoveryChart, FailureBreakdownChart, ChannelPerformanceChart, PaymentMethodChart)
│   │   ├── context/ (AuthContext, NotificationContext, ToastContext)
│   │   ├── pages/ (Landing, Login, Register, Dashboard, Transactions, TxnDetail, Customers, CustomerDetail, Campaigns, CampaignCreate, CampaignDetail, Analytics, AuditLogs, Settings)
│   │   └── App.tsx (React Router with route protection)
└── tests/
    ├── unit/recoveryEngine.test.js
    └── integration/api.test.js
```

---

## 🛡️ License

MIT License © 2026 RecoverAI Technologies Pvt Ltd.
