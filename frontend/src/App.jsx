import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ApplyOD from "./pages/ApplyOD";
import StudentODDetails from "./pages/StudentODDetails";
import AdminDashboard from "./pages/AdminDashBoard";
import FacultyDashboard from "./pages/FacultyDashboard";
import UpdatePlacementStatus from "./pages/UpdatePlacementStatus";
import FacultyApproval from "./pages/FacultyApproval";
import FacultyEvents from "./pages/FacultyEvents"; // ✅ New Import
import FacultyReportReview from "./pages/FacultyReportReview"; // ✅ Import Report Review
import MentorAssignment from "./pages/MentorAssignment";
import MenteeDetails from "./pages/MenteeDetails";
import StudentEvents from "./pages/StudentEvents"; // ✅ New Import
import ManageFaculty from "./pages/ManageFaculty";
import ManageStudents from "./pages/ManageStudents";
import ManageCompanies from "./pages/ManageCompanies";
import ManageODs from "./pages/ManageODs"; // ✅ Import ManageODs
import ManageInternalEvents from "./pages/ManageInternalEvents";
import ODHistory from "./pages/ODHistory";
import Notifications from "./pages/Notifications";
import ODStatus from "./pages/ODStatus";
import HelpSupport from "./pages/HelpSupport";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext"; // ✅ Import ChatProvider
import ChatAssistant from "./components/ChatAssistant";

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
                <Routes>
                  {/* ... routes ... */}
                  {/* I will use the actual routes below */}
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={<DashboardRedirect />} /> {/* ✅ Catch generic dashboard */}
                  <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["STUDENT"]}><Dashboard /></ProtectedRoute>} />
                  <Route path="/student/events" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentEvents /></ProtectedRoute>} /> {/* ✅ New Route */}
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
                  <Route path="/admin/manage-ods" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageODs /></ProtectedRoute>} /> {/* ✅ New Route */}
                  <Route path="/admin/internal-events" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageInternalEvents /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><Notifications /></ProtectedRoute>} />
                  <Route path="/faculty/approvals" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyApproval /></ProtectedRoute>} />
                  <Route path="/faculty/events" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyEvents /></ProtectedRoute>} /> {/* ✅ New Route */}
                  <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyReportReview /></ProtectedRoute>} /> {/* ✅ New Route */}
                  <Route path="/faculty/mentee/:studentId" element={<ProtectedRoute allowedRoles={["FACULTY"]}><MenteeDetails /></ProtectedRoute>} />
                  <Route path="/help" element={<ProtectedRoute allowedRoles={["STUDENT", "FACULTY"]}><HelpSupport /></ProtectedRoute>} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </ChatProvider>
        </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
