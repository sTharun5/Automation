# 🎓 Smart OD Portal — BIT Sathyamangalam

![Static Badge](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)
![Static Badge](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)
![Static Badge](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791?style=for-the-badge&logo=postgresql)

A specialized automated platform for **Bannari Amman Institute of Technology (BIT)** to streamline the On-Duty (OD) application, verification, and approval process. 

---

## 🌟 Key Features

### 🛡️ Smart Verification (OCR)
- **AI-Powered Parsing**: Automatically extracts text from uploaded PDF certificates to verify student names, roll numbers, and dates against application data.
- **Fraud Prevention**: Rejects applications with mismatched or suspicious document data instantly.

### 📊 Multirole Dashboards
- **Student Dashboard**: Apply for OD, upload proof, track approval progress, and view attendance history.
- **Faculty/Mentor Dashboard**: Manage mentees, review OD requests, mark attendance manually, and track placement progress.
- **Admin Dashboard**: Comprehensive control over events, user roles, faculty assignments, and system-wide reports.

### ✉️ Unrestricted Notification System
- **Transactional OTPs**: Secure login for any student or staff member using the **Brevo API**.
- **Email Alerts**: Automatic email notifications for OD approval/rejection and coordinator assignments.

### 📅 Advanced Event Management
- **Internal & External Events**: Create and manage college events with dedicated coordinators.
- **Coordinator Logic**: Assign and track student coordinators with specific permissions.

### 📈 Analytics & Reporting
- **Placement Tracking**: Monitor student placement cycles and status in real-time.
- **Detailed Reports**: Generate and export system-wide reports for OD history and student performance.

### 🗓️ Smart Academic Calendar
- **Event Syncing**: Integrated calendar showing holidays, events, and important deadlines.
- **Schedule Management**: Keep students and staff aligned with college-wide schedules.

### 📱 Premium Interactive UI
- **Zenith Design System**: High-fidelity, modern UI built with **Framer Motion** for smooth animations and transitions.
- **Responsive Layout**: Optimized for desktop, tablets, and smartphones.
- **Interactive Attendance**: Live QR-code based or manual attendance tracking modules.

### 🆘 Integrated Support Helpdesk
- **Query Management**: Students and faculty can submit support queries directly from the dashboard.
- **Attachment Support**: Send screenshots or videos along with support tickets for faster resolution.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Email** | Brevo API (Transactional Emails) |
| **Auth** | JWT (Stateless Authentication) + HttpOnly Cookies |
| **Tools** | Axios, PDF-Parse, XLSX, Recharts, Leaflet |

---

## 🏗️ Project Structure

```bash
├── frontend    # React application (Vite + Tailwind)
└── backend     # Express.js API + Prisma Schema + OCR Engine
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/stharun5/Automation.git
cd Automation
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env:
# DATABASE_URL, JWT_SECRET, BREVO_API_KEY, MAIL_USER
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Deployment
- **Frontend**: Hosted on [Vercel](https://automation-cx9ztyhni.vercel.app)
- **Backend**: Hosted on [Render](https://automation-f8jn.onrender.com)

---

## 🤝 Contribution
Developed for **Bannari Amman Institute of Technology**. 

© 2026 Smart OD Automation System. All rights reserved.
