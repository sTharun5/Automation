import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function ManageFaculty() {
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Form State
    const [form, setForm] = useState({
        facultyId: "",
        name: "",
        email: "",
        department: ""
    });
    const [formLoading, setFormLoading] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    useEffect(() => {
        fetchFaculty();
    }, []);

    const fetchFaculty = async () => {
        try {
            const res = await api.get("/admin/all-faculty");
            setFaculty(res.data);
        } catch (err) {
            showToast("Failed to fetch faculty list", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddFaculty = async () => {
        if (!form.facultyId || !form.name || !form.email) {
            showToast("Faculty ID, Name and Email are required", "error");
            return;
        }

        try {
            setFormLoading(true);
            await api.post("/admin/add-faculty", form);
            showToast("✅ Faculty added successfully", "success");
            setForm({ facultyId: "", name: "", email: "", department: "" });
            fetchFaculty(); // Refresh list
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add faculty", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const confirmDeleteFaculty = async (id) => {
        try {
            await api.delete(`/admin/faculty/${id}`);
            showToast("Faculty deleted successfully. Students unassigned.", "success");
            fetchFaculty();
        } catch (err) {
            showToast("Failed to delete faculty", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleDeleteFaculty = (id, name) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Faculty",
            message: `Are you sure you want to delete ${name}? Their assigned students will be unassigned, not deleted.`,
            onConfirm: () => confirmDeleteFaculty(id),
            isDanger: true,
            confirmText: "Yes, Delete"
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors"
                        >
                            ←
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Manage Faculty</h1>
                    </div>
                </div>

                {/* Add Faculty Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-8 transition-colors">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">➕ Add New Faculty</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            name="facultyId"
                            placeholder="Faculty ID (Unique)"
                            value={form.facultyId}
                            onChange={handleChange}
                            className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            value={form.name}
                            onChange={handleChange}
                            className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                        <input
                            type="text"
                            name="department"
                            placeholder="Department"
                            value={form.department}
                            onChange={handleChange}
                            className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleAddFaculty}
                            disabled={formLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formLoading ? "Adding..." : "Add Faculty"}
                        </button>
                    </div>
                </div>

                {/* Faculty List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="font-bold text-slate-700 dark:text-slate-300">Faculty Directory</h2>
                        <button
                            onClick={() => navigate("/admin/assign-mentor")}
                            className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
                        >
                            Manage Assignments →
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Faculty Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mentees</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-blue-500 animate-pulse font-bold">Loading Faculty Records...</td>
                                    </tr>
                                ) : faculty.length > 0 ? (
                                    faculty.map((f) => (
                                        <tr key={f.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{f.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{f.facultyId} • {f.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded uppercase">
                                                    {f.department || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black ${f.menteeCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                                        {f.menteeCount}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-medium">Students</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate("/admin/assign-mentor", { state: { facultyId: f.id, facultyName: f.name } })}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-bold"
                                                >
                                                    Manage Assignments
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFaculty(f.id, f.name)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors ml-4"
                                                    title="Delete Faculty"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-500 italic">No faculty members found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div>
    );
}
