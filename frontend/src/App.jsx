import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import Notifications from "./pages/Notifications";

/* ===============================
   PROTECTED ROUTE
================================ */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Login />} />

        {/* ================= STUDENT ================= */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply-od"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <ApplyOD />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/od/:odId"
          element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentODDetails />
            </ProtectedRoute>
          }
        />

        {/* ================= FACULTY ================= */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/update-placement"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <UpdatePlacementStatus />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign-mentor"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <MentorAssignment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ManageFaculty />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ManageStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["STUDENT", "FACULTY", "ADMIN"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/approvals"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <FacultyApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/mentee/:studentId"
          element={
            <ProtectedRoute allowedRoles={["FACULTY"]}>
              <MenteeDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
