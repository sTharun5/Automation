import { useState } from "react";
import api from "../api/axios";

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    facultyId: "",
    name: "",
    email: "",
    department: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setMessage("");
    setError("");

    if (!form.facultyId || !form.name || !form.email) {
      setError("Faculty ID, Name and Email are required");
      return;
    }

    try {
      setLoading(true);

      await api.post("/admin/add-faculty", form);

      setMessage("✅ Faculty added successfully");
      setForm({
        facultyId: "",
        name: "",
        email: "",
        department: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add faculty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="bg-[#111c2e] p-6 rounded-xl shadow mb-8">
        <p className="text-lg">
          Welcome,{" "}
          <span className="font-semibold">
            {user?.name || "Admin"}
          </span>
        </p>

        <p className="text-slate-400 mt-2">
          Email: {user?.email}
        </p>
      </div>

      {/* ================= ADD FACULTY ================= */}
      <div className="bg-[#111c2e] p-6 rounded-xl shadow max-w-xl">
        <h2 className="text-xl font-semibold mb-4">
          ➕ Add Faculty
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            name="facultyId"
            placeholder="Faculty ID (Unique)"
            value={form.facultyId}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded bg-[#0b1220] border border-slate-600"
          />

          <input
            type="text"
            name="name"
            placeholder="Faculty Name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded bg-[#0b1220] border border-slate-600"
          />

          <input
            type="email"
            name="email"
            placeholder="Faculty Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded bg-[#0b1220] border border-slate-600"
          />

          <input
            type="text"
            name="department"
            placeholder="Department (optional)"
            value={form.department}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded bg-[#0b1220] border border-slate-600"
          />

          {error && <p className="text-red-400">{error}</p>}
          {message && <p className="text-green-400">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            {loading ? "Saving..." : "Add Faculty"}
          </button>
        </div>
      </div>

      {/* ================= FUTURE SECTIONS ================= */}
      <div className="mt-8 space-y-3 max-w-xl">
        <div className="bg-[#0b1220] p-4 rounded-lg border border-slate-700">
          👨‍🏫 View Faculties (next step)
        </div>

      </div>
    </div>
  );
}
