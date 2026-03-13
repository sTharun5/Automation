import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import SearchableSelect from "../components/SearchableSelect";
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
    Calendar,
    ChevronRight,
    Terminal,
    ShieldAlert,
    Cpu,
    Activity,
    Mail,
    IdCard,
    SmartphoneIcon
} from "lucide-react";

export default function ManageStudents() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", rollNo: "", email: "", department: "", semester: "1", parentPhone: "" });
    const [editingStudent, setEditingStudent] = useState(null);

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
            setLoading(true);
            const res = await api.get("/admin/all-students");
            setStudents(res.data);
        } catch (err) {
            showToast("Failed to fetch student list", "error");
        } finally {
            setLoading(false);
        }
    };

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
            fetchStudents();
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
            setNewStudent({ name: "", rollNo: "", email: "", department: "", semester: "1", parentPhone: "" });
            fetchStudents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add student", "error");
        }
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/update-student/${editingStudent.id}`, editingStudent);
            showToast("Student updated successfully", "success");
            setEditModalOpen(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update student", "error");
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white">
            <Header />
            
            <main className="flex-1 px-4 sm:px-8 md:px-12 py-10 md:py-20 max-w-[1600px] mx-auto w-full space-y-12">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Command Hub
                        </button>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                                Entity Directory
                            </h1>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                                <Cpu className="w-3 h-3" /> Student Node & Mentor Synchronization
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 px-6 py-4">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Sync</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{students.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAddModalOpen(true)}
                            className="group bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /> Add Entity
                        </button>
                        <button
                            onClick={() => navigate("/admin/assign-mentor")}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                        >
                            Assigment Protocol
                        </button>
                    </div>
                </div>

                {/* Operations Layer */}
                <div className="space-y-10">
                    
                    {/* Filter & Hub Section */}
                    <div className="p-8 md:p-10 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="w-full lg:max-w-xl">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-2">
                                    <Search className="w-3 h-3" /> Pulse Scan
                                </h3>
                                <SearchInput
                                    placeholder="Enter Roll Protocol or Domain Name..."
                                    fetchSuggestions={fetchStudentSuggestions}
                                    onSelect={handleSelectStudent}
                                    renderSuggestion={(s) => (
                                        <div className="flex items-center gap-4 py-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-indigo-500">
                                                {s.name?.[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{s.name}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.rollNo} · {s.department}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                <button
                                    onClick={fetchStudents}
                                    className="mt-4 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] hover:text-indigo-700 transition-colors"
                                >
                                    Force Full Resync
                                </button>
                            </div>

                            <div className="hidden lg:block h-20 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                            <div className="flex flex-wrap items-center justify-center gap-6">
                                {[
                                    { label: "Departmental Nodes", value: "7 Operational", icon: <Layout /> },
                                    { label: "Active Semesters", value: "Current Phase", icon: <Calendar /> },
                                    { label: "Neural Integrity", value: "99.9%", icon: <Zap /> }
                                ].map((stat, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 text-center group/stat">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                                            {stat.icon}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{stat.value}</p>
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Registry List */}
                    <div className="p-1 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-50 dark:border-slate-800/50">
                                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Entity Identity</th>
                                        <th className="hidden sm:table-cell px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sector</th>
                                        <th className="px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Status</th>
                                        <th className="hidden md:table-cell px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Liaison Signal</th>
                                        <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Command</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Cpu className="w-10 h-10 text-indigo-500 animate-spin" />
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Polling Database Nodes...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : students.length > 0 ? (
                                        students.map((s, i) => (
                                            <tr key={s.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-black text-white uppercase transition-transform group-hover:scale-110 shadow-lg shadow-indigo-500/20">
                                                            {s.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.rollNo} · {s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-8 py-8">
                                                    <span className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                        {s.department || "CORE"} · SEM {s.semester}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    {s.placement_status === "NIP" ? (
                                                        <span className="text-[9px] font-black px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-widest border border-amber-500/20 underline decoration-dotted decoration-amber-500/40">NIP</span>
                                                    ) : (s.offers && s.offers.length > 0) || s.placement_status === "PLACED" ? (
                                                        <span className="text-[9px] font-black px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2 w-fit">
                                                            <Zap className="w-3 h-3" /> Placed {s.offers?.length > 0 ? `[${s.offers.length}]` : ""}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700/50">Static</span>
                                                    )}
                                                </td>
                                                <td className="hidden md:table-cell px-8 py-8">
                                                    {s.mentor ? (
                                                        <div className="flex items-center gap-4 group/mentor">
                                                            <div className="flex flex-col">
                                                                <p className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{s.mentor.name}</p>
                                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.mentor.facultyId}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMentor(s.id)}
                                                                className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-500/5 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No Signal</span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                                                        <button
                                                            onClick={() => navigate("/admin/assign-mentor", { state: { preSelectedStudent: s } })}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                                                        >
                                                            {s.mentor ? "Update Relay" : "Map Mentor"}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingStudent(s); setEditModalOpen(true); }}
                                                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-10 py-32 text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">No active entities detected in sector scan.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals Revamped with Premium Look */}
            {addModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg border-2 border-slate-100 dark:border-slate-800 p-10 md:p-12 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Integrate Entity</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Module Deployment Protocol</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddStudent} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: "Identity Label", key: "name", icon: <User />, placeholder: "Full Name" },
                                    { label: "Roll Protocol", key: "rollNo", icon: <IdCard />, placeholder: "Registry ID" },
                                    { label: "Neural Email", key: "email", icon: <Mail />, placeholder: "domain@inst.edu", type: "email" },
                                    { label: "Emergency Signal", key: "parentPhone", icon: <SmartphoneIcon />, placeholder: "Parent Contact", type: "tel" }
                                ].map((input) => (
                                    <div key={input.key} className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{input.label}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                                {input.icon}
                                            </div>
                                            <input
                                                required
                                                type={input.type || "text"}
                                                placeholder={input.placeholder}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-indigo-500/20 outline-none transition-all text-sm font-bold dark:text-white"
                                                value={newStudent[input.key]}
                                                onChange={e => setNewStudent({ ...newStudent, [input.key]: input.key === 'rollNo' ? e.target.value.toUpperCase() : e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <SearchableSelect
                                    label="Sector Assignment"
                                    placeholder="Sector..."
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
                                    label="Temporal Phase"
                                    placeholder="Phase..."
                                    value={newStudent.semester}
                                    onChange={(val) => setNewStudent({ ...newStudent, semester: val })}
                                    options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `SEM ${s}`, icon: <Calendar className="w-4 h-4 text-indigo-500" /> }))}
                                />
                            </div>

                            <div className="flex items-center gap-4 mt-12">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="flex-1 py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all"
                                >
                                    Push Integration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal (Similar Treatment) */}
            {editModalOpen && editingStudent && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-lg border-2 border-slate-100 dark:border-slate-800 p-10 md:p-12 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                                <Edit className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Refactor Entity</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Modify Registry Manifest</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateStudent} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: "Identity Label", key: "name", icon: <User />, placeholder: "Full Name" },
                                    { label: "Roll Protocol", key: "rollNo", icon: <IdCard />, placeholder: "Registry ID" },
                                    { label: "Neural Email", key: "email", icon: <Mail />, placeholder: "domain@inst.edu", type: "email" },
                                    { label: "Emergency Signal", key: "parentPhone", icon: <SmartphoneIcon />, placeholder: "Parent Contact", type: "tel" }
                                ].map((input) => (
                                    <div key={input.key} className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{input.label}</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                                {input.icon}
                                            </div>
                                            <input
                                                required
                                                type={input.type || "text"}
                                                placeholder={input.placeholder}
                                                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-blue-500/20 outline-none transition-all text-sm font-bold dark:text-white"
                                                value={editingStudent[input.key]}
                                                onChange={e => setEditingStudent({ ...editingStudent, [input.key]: input.key === 'rollNo' ? e.target.value.toUpperCase() : e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <SearchableSelect
                                    label="Sector Assignment"
                                    placeholder="Sector..."
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
                                    label="Temporal Phase"
                                    placeholder="Phase..."
                                    value={editingStudent.semester}
                                    onChange={(val) => setEditingStudent({ ...editingStudent, semester: val })}
                                    options={[1, 2, 3, 4, 5, 6, 7, 8].map(s => ({ value: String(s), label: `SEM ${s}`, icon: "📅" }))}
                                />
                            </div>

                            <div className="flex items-center gap-4 mt-12">
                                <button
                                    type="button"
                                    onClick={() => { setEditModalOpen(false); setEditingStudent(null); }}
                                    className="flex-1 py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                                >
                                    Commit Refactor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div>
    );
}
