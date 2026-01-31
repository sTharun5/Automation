import { useState } from "react";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">Admin Dashboard</h1>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm mb-8 transition-colors">
          <p className="text-lg text-slate-900 dark:text-white">
            Welcome, <span className="font-semibold">{user?.name || "Admin"}</span>
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Email: {user?.email}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm max-w-xl transition-colors">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">➕ Add Faculty</h2>
          <div className="space-y-4">
            <input
              type="text"
              name="facultyId"
              placeholder="Faculty ID (Unique)"
              value={form.facultyId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-colors"
            />
            <input
              type="text"
              name="name"
              placeholder="Faculty Name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-colors"
            />
            <input
              type="email"
              name="email"
              placeholder="Faculty Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-colors"
            />
            <input
              type="text"
              name="department"
              placeholder="Department (optional)"
              value={form.department}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white transition-colors"
            />
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            >
              {loading ? "Saving..." : "Add Faculty"}
            </button>
          </div>
        </div>

        <div className="mt-8 max-w-xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg text-slate-600 dark:text-slate-400 transition-colors">
            👨‍🏫 View Faculties (next step)
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
