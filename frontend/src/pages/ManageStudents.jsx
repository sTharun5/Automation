import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import SearchableSelect from "../components/SearchableSelect";
import usePolling from "../hooks/usePolling";
import LoadingButton from "../components/LoadingButton";
import {
    ArrowLeft,
    Plus,
    UserPlus,
    Search,
    User,
    Trash2,
    Edit,
    GraduationCap,
    Layout,
    Smartphone,
    Radio,
    Zap,
    Settings,
    Beaker,
    Brain,
    Calendar
} from "lucide-react";

/**
 * ManageStudents component - Administrative module for orchestrating the student database.
 * Facilitates student enrollment, profile editing, mentor unassignment,
 * and bulk student searching with real-time suggestions and placement status tracking.
 */
export default function ManageStudents() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", rollNo: "", email: "", department: "", semester: "1", parentPhone: "" });
    const [editingStudent, setEditingStudent] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/all-students");
            setStudents(res.data);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch student list", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchStudents]);

    // Auto-refresh every 30 s
    usePolling(fetchStudents, 30000);

    const fetchStudentSuggestions = async (query) => {
        const res = await api.get(`/students/search?q=${query}`);
        return res.data;
    };

    const handleSelectStudent = (student) => {
        setStudents([student]);
    };

    const confirmRemoveMentor = async (studentId) => {
        try {
            await api.put("/admin/remove-mentor", { studentId });
            showToast("Mentor removed successfully", "success");
            fetchStudents(); // Refresh list
        } catch (err) {
            console.error(err);
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
        if (formSubmitting) return;
        try {
            setFormSubmitting(true);
            await api.post("/admin/add-student", newStudent);
            showToast("Student added successfully", "success");
            setAddModalOpen(false);
            setNewStudent({ name: "", rollNo: "", email: "", department: "", semester: "1", parentPhone: "" });
            fetchStudents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add student", "error");
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        if (formSubmitting) return;
        try {
            setFormSubmitting(true);
            await api.put(`/admin/update-student/${editingStudent.id}`, editingStudent);
            showToast("Student updated successfully", "success");
            setEditModalOpen(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update student", "error");
        } finally {
            setFormSubmitting(false);
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
                            className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors flex items-center justify-center"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Manage Students</h1>
                    </div>
                </div>

                {/* Search Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:w-1/2">
                        <SearchInput
                            placeholder="Search by Name or Roll No..."
                            fetchSuggestions={fetchStudentSuggestions}
                            onSelect={handleSelectStudent}
                            renderSuggestion={(s) => (
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                                    <span className="text-xs text-slate-500">{s.rollNo} • {s.department}</span>
                                </div>
                            )}
                        />
                    </div>
                    <button
                        onClick={fetchStudents}
                        className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                        Show All Students
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setAddModalOpen(true)}
                            aria-label="Add new student"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" aria-hidden="true" /> Add Student
                        </button>
                        <button
                            onClick={() => navigate("/admin/assign-mentor")}
                            aria-label="Assign mentors to students"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" aria-hidden="true" /> Assign Mentors
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
                                    <SearchableSelect
                                        label="Department"
                                        placeholder="Select dept..."
                                        value={newStudent.department}
                                        onChange={(val) => setNewStudent({ ...newStudent, department: val })}
                                        options={[
                                            { value: "CS", label: "CS", icon: <Layout className="w-4 h-4 text-blue-500" /> },
                                            { value: "IT", label: "IT", icon: <Smartphone className="w-4 h-4 text-indigo-500" /> },
                                            { value: "EC", label: "EC", icon: <Radio className="w-4 h-4 text-emerald-500" /> },
                                            { value: "EE", label: "EE", icon: <Zap className="w-4 h-4 text-amber-500" /> },
                                            { value: "ME", label: "ME", icon: <Settings className="w-4 h-4 text-slate-500" /> },
                                            { value: "CB", label: "CB", icon: <Beaker className="w-4 h-4 text-rose-500" /> },
                                            { value: "AI", label: "AI", icon: <Brain className="w-4 h-4 text-purple-500" /> }
                                        ]}
                                    />
                                    <SearchableSelect
                                        label="Semester"
                                        placeholder="Pick..."
                                        value={newStudent.semester}
                                        onChange={(val) => setNewStudent({ ...newStudent, semester: val })}
                                        options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: String(s), icon: <Calendar className="w-4 h-4 text-blue-500" /> }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Phone <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={newStudent.parentPhone || ""}
                                        onChange={e => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        isLoading={formSubmitting}
                                        loadingText="Adding..."
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/30 font-bold"
                                    >
                                        Add Student
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Student Modal */}
                {editModalOpen && editingStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-white">Edit Student Details</h2>
                            <form onSubmit={handleUpdateStudent} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={editingStudent.name}
                                        onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Roll Number</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={editingStudent.rollNo}
                                        onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={editingStudent.email}
                                        onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SearchableSelect
                                        label="Department"
                                        placeholder="Select dept..."
                                        value={editingStudent.department}
                                        onChange={(val) => setEditingStudent({ ...editingStudent, department: val })}
                                        options={[
                                            { value: "CS", label: "CS", icon: "💻" },
                                            { value: "IT", label: "IT", icon: "📱" },
                                            { value: "EC", label: "EC", icon: "📡" },
                                            { value: "EE", label: "EE", icon: "⚡" },
                                            { value: "ME", label: "ME", icon: "⚙️" },
                                            { value: "CB", label: "CB", icon: "🧪" },
                                            { value: "AI", label: "AI", icon: "🧠" }
                                        ]}
                                    />
                                    <SearchableSelect
                                        label="Semester"
                                        placeholder="Pick..."
                                        value={editingStudent.semester}
                                        onChange={(val) => setEditingStudent({ ...editingStudent, semester: val })}
                                        options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: String(s), icon: "📅" }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Phone <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        value={editingStudent.parentPhone || ""}
                                        onChange={e => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => { setEditModalOpen(false); setEditingStudent(null); }}
                                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <LoadingButton
                                        type="submit"
                                        isLoading={formSubmitting}
                                        loadingText="Saving..."
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/30 font-bold"
                                    >
                                        Save Changes
                                    </LoadingButton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left border-collapse" aria-label="Student management records">
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
                                        <td colSpan="5" className="px-6 py-20 text-center text-blue-500 animate-pulse font-bold uppercase tracking-widest">Loading Student Records...</td>
                                    </tr>
                                ) : students.length > 0 ? (
                                    students.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{s.name}</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{s.rollNo} • {s.email}</p>
                                                {s.parentPhone && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Parent: {s.parentPhone}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded uppercase border border-slate-200 dark:border-slate-700">
                                                    {s.department || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.placement_status === "NIP" ? (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase border border-amber-200 dark:border-amber-900/10">NIP</span>
                                                ) : (s.offers && s.offers.length > 0) || s.placement_status === "PLACED" ? (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase border border-green-200 dark:border-green-900/10 whitespace-nowrap">Placed {s.offers?.length > 0 ? `(${s.offers.length})` : ""}</span>
                                                ) : (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase border border-slate-200 dark:border-slate-700">Unplaced</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.mentor ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate">{s.mentor.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">{s.mentor.facultyId}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMentor(s.id)}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                                                            aria-label={`Unassign mentor from student ${s.name}`}
                                                            title="Unassign Mentor"
                                                        >
                                                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic font-medium">No mentor assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <button
                                                        onClick={() => navigate("/admin/assign-mentor", { state: { preSelectedStudent: s } })}
                                                        aria-label={`${s.mentor ? 'Reassign' : 'Assign'} mentor for ${s.name}`}
                                                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-black uppercase tracking-wider transition-colors"
                                                    >
                                                        {s.mentor ? "Reassign" : "Assign Mentor"}
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingStudent(s); setEditModalOpen(true); }}
                                                        aria-label={`Edit details for ${s.name}`}
                                                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Edit className="w-3 h-3" /> Edit Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center text-slate-500 italic">No records found matching your search.</td>
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
