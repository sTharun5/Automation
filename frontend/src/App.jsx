import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ApplyOD from "./pages/ApplyOD";
import StudentODDetails from "./pages/StudentODDetails";
import AdminDashboard from "./pages/AdminDashBoard";
import FacultyDashboard from "./pages/FacultyDashboard";
import UpdatePlacementStatus from "./pages/UpdatePlacementStatus";

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
      </Routes>
    </BrowserRouter>
  );
}
