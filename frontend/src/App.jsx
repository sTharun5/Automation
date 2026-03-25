import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/login";

// Lazy-load heavy pages for faster initial load
const Dashboard             = lazy(() => import("./pages/dashboard"));
const ApplyOD               = lazy(() => import("./pages/ApplyOD"));
const StudentODDetails      = lazy(() => import("./pages/StudentODDetails"));
const AdminDashboard        = lazy(() => import("./pages/AdminDashBoard"));
const FacultyDashboard      = lazy(() => import("./pages/FacultyDashboard"));
const UpdatePlacementStatus = lazy(() => import("./pages/UpdatePlacementStatus"));
const FacultyApproval       = lazy(() => import("./pages/FacultyApproval"));
const FacultyEvents         = lazy(() => import("./pages/FacultyEvents"));
const FacultyReportReview   = lazy(() => import("./pages/FacultyReportReview"));
const MentorAssignment      = lazy(() => import("./pages/MentorAssignment"));
const MenteeDetails         = lazy(() => import("./pages/MenteeDetails"));
const StudentEvents         = lazy(() => import("./pages/StudentEvents"));
const ManageFaculty         = lazy(() => import("./pages/ManageFaculty"));
const ManageStudents        = lazy(() => import("./pages/ManageStudents"));
const ManageCompanies       = lazy(() => import("./pages/ManageCompanies"));
const ManageODs             = lazy(() => import("./pages/ManageODs"));
const ManageInternalEvents  = lazy(() => import("./pages/ManageInternalEvents"));
const ODHistory             = lazy(() => import("./pages/ODHistory"));
const Notifications         = lazy(() => import("./pages/Notifications"));
const ODStatus              = lazy(() => import("./pages/ODStatus"));
const HelpSupport           = lazy(() => import("./pages/HelpSupport"));
const LoginHistory          = lazy(() => import("./pages/LoginHistory"));

import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import ChatAssistant from "./components/ChatAssistant";

// Page-level loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading...</p>
    </div>
  </div>
);

/* ===============================
   PROTECTED ROUTE
================================ */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("token"); // Enforce new token storage

  // Check if role exists and is allowed, and token is present
  if (!role || !allowedRoles.includes(role) || !token) {
    sessionStorage.clear(); // Clear potentially corrupted state
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout component to selectively show ChatAssistant
const Layout = ({ children }) => {
  const location = useLocation();
  const role = sessionStorage.getItem("role");
  const showChat = location.pathname !== "/" && role === "STUDENT";

  return (
    <>
      {children}
      {showChat && <ChatAssistant />}
    </>
  );
};

// Redirect /dashboard to role-specific path
const DashboardRedirect = () => {
  const role = sessionStorage.getItem("role");
  if (role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
  if (role === "FACULTY") return <Navigate to="/faculty/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NotificationProvider>
          <ChatProvider>
            <BrowserRouter>
              <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={<DashboardRedirect />} />
                  <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["STUDENT"]}><Dashboard /></ProtectedRoute>} />
                  <Route path="/student/events" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentEvents /></ProtectedRoute>} />
                  <Route path="/apply-od" element={<ProtectedRoute allowedRoles={["STUDENT"]}><ApplyOD /></ProtectedRoute>} />
                  <Route path="/student/od/:odId" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentODDetails /></ProtectedRoute>} />
                  <Route path="/od-history" element={<ProtectedRoute allowedRoles={["STUDENT"]}><ODHistory /></ProtectedRoute>} />
                  <Route path="/od-status" element={<ProtectedRoute allowedRoles={["STUDENT"]}><ODStatus /></ProtectedRoute>} />
                  <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyDashboard /></ProtectedRoute>} />
                  <Route path="/faculty/update-placement" element={<ProtectedRoute allowedRoles={["FACULTY"]}><UpdatePlacementStatus /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/assign-mentor" element={<ProtectedRoute allowedRoles={["ADMIN"]}><MentorAssignment /></ProtectedRoute>} />
                  <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageFaculty /></ProtectedRoute>} />
                  <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageStudents /></ProtectedRoute>} />
                  <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageCompanies /></ProtectedRoute>} />
                  <Route path="/admin/manage-ods" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageODs /></ProtectedRoute>} />
                  <Route path="/admin/internal-events" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageInternalEvents /></ProtectedRoute>} />
                  <Route path="/admin/login-history" element={<ProtectedRoute allowedRoles={["ADMIN"]}><LoginHistory /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><Notifications /></ProtectedRoute>} />
                  <Route path="/faculty/approvals" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyApproval /></ProtectedRoute>} />
                  <Route path="/faculty/events" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyEvents /></ProtectedRoute>} />
                  <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyReportReview /></ProtectedRoute>} />
                  <Route path="/faculty/mentee/:studentId" element={<ProtectedRoute allowedRoles={["FACULTY"]}><MenteeDetails /></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><HelpSupport /></ProtectedRoute>} />
                </Routes>
              </Suspense>
              </Layout>
            </BrowserRouter>
          </ChatProvider>
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
