# 🎓 Smart OD Portal — BIT Sathyamangalam

![Static Badge](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)
![Static Badge](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)
![Static Badge](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791?style=for-the-badge&logo=postgresql)

A specialized **Smart Automation** platform for **Bannari Amman Institute of Technology (BIT)** that replaces manual paperwork with an intelligent, autonomous On-Duty (OD) approval ecosystem.

---

## 🤖 Smart Automation Features

### 🛡️ Autonomous Document Verification (AI-OCR)
- **Zero-Touch Parsing**: The system features an autonomous DocSense engine that instantly reads uploaded PDFs, extracting critical data points (names, dates, roll numbers) without any human oversight.
- **Intelligent Fraud Shield**: Automatically cross-references extracted document data against system records to instantly detect and halt suspicious applications before they reach a human reviewer.

### 📊 Intelligent Multi-Portal Dashboards
- **Self-Service Student Hub**: Automated application workflows that allow students to apply, upload proof, and watch their approval move through the pipeline in real-time.
- **Smart Mentor Workspace**: An automated priority queue for faculty members to review pre-verified applications, track mentee placement cycles, and manage digital attendance logs.
- **Global Control Center**: An centralized admin dashboard that automates the management of events, faculty assignments, and institutional reporting.

### ✉️ Automated Communication Layer
- **Instant OTP Workflows**: Secure, frictionless login managed by the **Brevo API**, capable of reaching any student or faculty member instantly.
- **Proactive Alerts**: Automated email triggers that notify stakeholders the moment an OD is applied for, approved, or rejected.

### 📅 Autonomous Event Orchestration
- **Smart Assignment Engine**: Automates the process of creating internal/external events and instantly assigning student coordinators with pre-configured access permissions.
- **Live Lifecycle Tracking**: Tracks the entire lifecycle of an event from creation to final attendance reporting automatically.

### 📉 Predictive Analytics & Real-Time Reporting
- **Automated Placement Monitor**: Intelligently tracks student placement statuses and progress through complex hiring cycles.
- **Instant Insights Engine**: Generates comprehensive institutional reports on-demand, transforming thousands of data points into actionable summaries.

### 🗓️ Dynamic Academic Synchronization
- **Auto-Sync Calendar**: A centralized calendar that automatically pulls in academic holidays, events, and deadlines, keeping the entire campus in perfect sync.
- **Smart Schedule Alignment**: Seamlessly aligns student schedules with institutional priorities without manual data entry.

### 📱 Zenith Design System (UX Automation)
- **High-Fidelity Animations**: Built with **Framer Motion** to automate micro-interactions and transitions for a premium, buttery-smooth experience.
- **Adaptive UI**: A responsive interface that automatically reconfigures its layout for desktop, tablet, and mobile viewing.
- **QR-Attendance Automation**: Instantly capture attendance via secure, dynamically generated QR codes or smart manual entry.

---

## 🛠️ Technology Stack (Powering the Automation)

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Email API** | Brevo (Transactional Email Automation) |
| **Auth** | JWT (Stateless) + HttpOnly Cookies |
| **Data Tools** | PDF-Parse, XLSX Hub, Recharts, Leaflet |

---

## 🏗️ Project Architecture

```bash
├── frontend    # Intelligent UI Layer (React + Vite)
└── backend     # Autonomous Core (Express + Prisma + OCR Engine)
```

---

## ⚙️ One-Command Setup

### 1. Clone & Initialize
```bash
git clone https://github.com/stharun5/Automation.git
cd Automation
```

### 2. Activate the Backend
```bash
cd backend
npm install
npm run dev
```

### 3. Launch the Frontend
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Live Environments
- **Frontend Hub**: Managed on [Vercel](https://automation-cx9ztyhni.vercel.app)
- **Autonomous Backend**: Running on [Render](https://automation-f8jn.onrender.com)

---

## 🤝 Institutional Mission
Developed for **Bannari Amman Institute of Technology** to drive digital transformation through smart automation.

© 2026 Smart OD Automation System. All rights reserved.
