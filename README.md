# 🎓 Smart OD Portal — BIT Sathyamangalam

![Static Badge](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=for-the-badge&logo=react)
![Static Badge](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=for-the-badge&logo=node.js)
![Static Badge](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791?style=for-the-badge&logo=postgresql)

A specialized automated platform for **Bannari Amman Institute of Technology (BIT)** to streamline the On-Duty (OD) application, verification, and approval process. 

---

## 🚀 Key Features

### 🛡️ Smart Verification (OCR)
- **AI-Powered**: Automatically parses uploaded PDF documents to verify student names, roll numbers, and dates.
- **OCR Engine**: Uses advanced PDF parsing to cross-check application data against official documents.

### 📊 Role-Based Dashboards
- **Student**: Apply for OD, upload certificates, and track real-time approval status.
- **Faculty/Mentor**: Review student applications, approve/reject based on validity, and manage student attendance logs.
- **Admin**: Complete system overview, coordinator management, and event organization.

### ✉️ Real-Time Notifications
- **Email OTPs**: Secure login system for students and staff via **Brevo API**.
- **Instant Alerts**: Get notified immediately when an OD is applied for or its status changes.
- **Socket.io Migration**: (Planned) Real-time live dashboard updates.

### 📱 Responsive UI
- **Zenith Design System**: Professional, high-fidelity UI optimized for both desktop and mobile.
- **Dark/Light Mode**: Premium aesthetics with smooth transitions.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL (Supabase) |
| **Email** | Brevo API (Transactional Emails) |
| **Auth** | JWT (Stateless Authentication) + HttpOnly Cookies |
| **Tools** | Axios, PDF-Parse, XLSX, Recharts |

---

## 🏗️ Project Structure

```bash
├── frontend    # React application (Vite)
└── backend     # Express.js API + Prisma Schema
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
# Create a .env file with:
# DATABASE_URL="your_supabase_url"
# JWT_SECRET="your_secret"
# BREVO_API_KEY="your_brevo_key"
# MAIL_USER="your_verified_email"
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Deployment Details

| Link | Description |
| :--- | :--- |
| **Frontend** | [Vercel](https://automation-cx9ztyhni.vercel.app) |
| **Backend** | [Render](https://automation-f8jn.onrender.com) |

---

## 🤝 Contribution
Developed for **Bannari Amman Institute of Technology**. 

© 2026 Smart OD Automation System. All rights reserved.
