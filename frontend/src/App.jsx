import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ApplyOD from "./pages/ApplyOD";
import StudentODDetails from "./pages/StudentODDetails";
import AdminDashboard from "./pages/AdminDashBoard";
import FacultyDashboard from "./pages/FacultyDashboard";
import UpdatePlacementStatus from "./pages/UpdatePlacementStatus";
import FacultyApproval from "./pages/FacultyApproval";
import MentorAssignment from "./pages/MentorAssignment";
import MenteeDetails from "./pages/MenteeDetails";
import ManageFaculty from "./pages/ManageFaculty";
import ManageStudents from "./pages/ManageStudents";
import ManageCompanies from "./pages/ManageCompanies";
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
const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  if (!token || !allowedRoles.includes(role)) {
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
                  <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["STUDENT"]}><Dashboard /></ProtectedRoute>} />
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
                  <Route path="/notifications" element={<ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}><Notifications /></ProtectedRoute>} />
                  <Route path="/faculty/approvals" element={<ProtectedRoute allowedRoles={["FACULTY"]}><FacultyApproval /></ProtectedRoute>} />
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
