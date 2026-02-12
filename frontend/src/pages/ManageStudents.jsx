import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function ManageStudents() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", rollNo: "", email: "", department: "", semester: "1" });

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get("/admin/all-students");
            setStudents(res.data);
        } catch (err) {
            showToast("Failed to fetch student list", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmRemoveMentor = async (studentId) => {
        try {
            await api.put("/admin/remove-mentor", { studentId });
            showToast("Mentor removed successfully", "success");
            fetchStudents(); // Refresh list
        } catch (err) {
            showToast("Removal failed", "error");
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleRemoveMentor = (studentId) => {
        setConfirmModal({
            isOpen: true,
            title: "Unassign Mentor",
            message: "Are you sure you want to remove the mentor for this student?",
            onConfirm: () => confirmRemoveMentor(studentId),
            isDanger: true,
            confirmText: "Yes, Remove"
        });
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post("/admin/add-student", newStudent);
            showToast("Student added successfully", "success");
            setAddModalOpen(false);
            setNewStudent({ name: "", rollNo: "", email: "", department: "", semester: "1" });
            fetchStudents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add student", "error");
        }
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
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Manage Students</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <span>➕</span> Add Student
                        </button>
                        <button
                            onClick={() => navigate("/admin/assign-mentor")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <span>🤝</span> Assign Mentors
                        </button>
                    </div>
                </div>

                {/* Add Student Modal */}
                {addModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Add New Student</h2>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={newStudent.name}
                                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={newStudent.rollNo}
                                        onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            value={newStudent.department}
                                            onChange={e => setNewStudent({ ...newStudent, department: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            <option value="CS">CS</option>
                                            <option value="IT">IT</option>
                                            <option value="EC">EC</option>
                                            <option value="EE">EE</option>
                                            <option value="ME">ME</option>
                                            <option value="CB">CB</option>
                                            <option value="AI">AI</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
                                        <select
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            value={newStudent.semester}
                                            onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/30 transition-all font-bold"
                                    >
                                        Add Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Student Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Department</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assigned Mentor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-blue-500 animate-pulse font-bold">Loading Student Records...</td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{s.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{s.rollNo} • {s.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded uppercase">
                                                    {s.department || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.placement_status === "NIP" ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">NIP</span>
                                                ) : (s.offers && s.offers.length > 0) || s.placement_status === "PLACED" ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">Placed {s.offers?.length > 0 ? `(${s.offers.length})` : ""}</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase">Unplaced</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.mentor ? (
                                                    <div className="flex items-center gap-2">
                                                        <div>
                                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{s.mentor.name}</p>
                                                            <p className="text-[10px] text-slate-500">{s.mentor.facultyId}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMentor(s.id)}
                                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Unassign Mentor"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic font-medium">No mentor assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate("/admin/assign-mentor", { state: { preSelectedStudent: s } })}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-bold"
                                                >
                                                    {s.mentor ? "Reassign" : "Assign Mentor"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-20 text-center text-slate-500 italic">No students found.</td>
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
