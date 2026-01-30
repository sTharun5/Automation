import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ApplyOD from "./pages/ApplyOD";
import StudentODDetails from "./pages/StudentODDetails";
import AdminDashboard from "./pages/AdminDashBoard";
import FacultyDashboard from "./pages/FacultyDashboard";
import UpdatePlacementStatus from "./pages/UpdatePlacementStatus";

/* ===============================
   PROTECTED ROUTE COMPONENT
================================ */
const ProtectedRoute = ({ allowedRole, children }) => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token || role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />

        {/* STUDENT */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="STUDENT">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* FACULTY */}
        <Route
          path="/faculty/dashboard"
          element={
            <ProtectedRoute allowedRole="FACULTY">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/update-placement"
          element={
            <ProtectedRoute allowedRole="FACULTY">
              <UpdatePlacementStatus />
            </ProtectedRoute>
          }
        />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* SHARED */}
        <Route path="/apply-od" element={<ApplyOD />} />
        <Route path="/student/od/:odId" element={<StudentODDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
