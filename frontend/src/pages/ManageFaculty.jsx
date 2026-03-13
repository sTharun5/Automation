import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import { 
  ArrowLeft, 
  Trash2, 
  UserPlus, 
  Users, 
  Building2, 
  Mail, 
  IdCard, 
  ChevronRight,
  Search,
  Users2,
  Terminal,
  Cpu,
  ShieldAlert,
  RotateCcw,
  Building
} from "lucide-react";

export default function ManageFaculty() {
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [form, setForm] = useState({
        facultyId: "",
        name: "",
        email: "",
        department: ""
    });
    const [formLoading, setFormLoading] = useState(false);

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
            setLoading(true);
            const res = await api.get("/admin/all-faculty");
            setFaculty(res.data);
        } catch (err) {
            showToast("Failed to fetch faculty list", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchFacultySuggestions = async (query) => {
        if (!query) return [];
        return faculty.filter(f =>
            f.name?.toLowerCase().includes(query.toLowerCase()) ||
            f.facultyId?.toLowerCase().includes(query.toLowerCase())
        );
    };

    const handleSelectFaculty = (f) => {
        setFaculty([f]);
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
            fetchFaculty();
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
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors selection:bg-indigo-500 selection:text-white">
            <Header />
            
            <main className="flex-1 px-4 sm:px-8 md:px-12 py-12 md:py-20 max-w-[1400px] mx-auto w-full space-y-16">
                
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 px-4">
                    <div className="space-y-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="group flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-500 transition-colors"
                        >
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-indigo-500/10 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Return to Command
                        </button>
                        <div className="space-y-3">
                            <h1 className="text-5xl md:text-6xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic leading-[0.8]">
                                Personnel <span className="text-indigo-500">Registry</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.05em] max-w-2xl">
                                Core human resource management. Register and authorize sector liaisons for mentorship synchronization and OD audit directives.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="bg-white dark:bg-slate-900 px-8 py-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Users2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Liaisons</p>
                                <p className="text-2xl font-[1000] text-slate-900 dark:text-white leading-none italic">{faculty.length}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/admin/assign-mentor")}
                            className="group relative bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/20"
                        >
                            <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                                Manage Assignments <ChevronRight className="w-4 h-4" />
                            </span>
                        </button>
                    </div>
                </div>                {/* Operations Layer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Add Faculty Form (Left/Top) */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="p-10 md:p-12 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group/form">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[100px] -mr-24 -mt-24 group-hover/form:bg-indigo-500/10 transition-colors"></div>
                           
                           <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <UserPlus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">New Entity</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Initialize Liaison Profile</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { name: "facultyId", placeholder: "Personnel ID [e.g. FAC-001]", icon: <IdCard className="w-5 h-5" /> },
                                        { name: "name", placeholder: "Display Name [Full Legal Name]", icon: <Users className="w-5 h-5" /> },
                                        { name: "email", placeholder: "Liaison Network Email", icon: <Mail className="w-5 h-5" />, type: "email" },
                                        { name: "department", placeholder: "Assigned Sector/Department", icon: <Building2 className="w-5 h-5" /> }
                                    ].map((field) => (
                                        <div key={field.name} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                                                {field.placeholder.split('[')[0].trim()}
                                            </label>
                                            <div className="relative group/field">
                                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/field:text-indigo-500 transition-colors">
                                                    {field.icon}
                                                </div>
                                                <input
                                                    type={field.type || "text"}
                                                    name={field.name}
                                                    placeholder={field.placeholder.split('[')[1]?.replace(']', '') || field.placeholder}
                                                    value={form[field.name]}
                                                    onChange={handleChange}
                                                    className="w-full pl-14 pr-6 py-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500/50 outline-none transition-all text-sm font-bold dark:text-white placeholder:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button
                                        onClick={handleAddFaculty}
                                        disabled={formLoading}
                                        className="w-full mt-6 py-5 rounded-[2rem] bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 disabled:bg-indigo-300 transition-all flex items-center justify-center gap-4 group/btn overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                        <span className="relative z-10 flex items-center gap-4">
                                            {formLoading ? (
                                                <><RotateCcw className="w-5 h-5 animate-spin" /> Authorization Pending...</>
                                            ) : (
                                                <>Integrate Profile <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" /></>
                                            )}
                                        </span>
                                    </button>
                                </div>
                           </div>
                        </div>

                        {/* Search Filter Widget - DARK MODE THEME */}
                        <div className="p-10 rounded-[3rem] bg-slate-900 border-2 border-white/5 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group/search">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover/search:bg-indigo-500/10 transition-colors pointer-events-none"></div>
                           
                           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                                <Search className="w-4 h-4 text-indigo-500" /> Neural Scan
                           </h3>
                           
                           <div className="space-y-8">
                                <SearchInput
                                    placeholder="COMMAND: ANALYZE ID OR NAME..."
                                    fetchSuggestions={fetchFacultySuggestions}
                                    onSelect={handleSelectFaculty}
                                    containerClassName="bg-slate-800/50 border-2 border-white/5 rounded-2xl px-6 py-4 focus-within:border-indigo-500/50 transition-all"
                                    renderSuggestion={(f) => (
                                        <div className="flex items-center gap-4 p-3 hover:bg-indigo-500/10 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-[1000] text-indigo-500 uppercase italic">
                                                {f.name?.[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black uppercase tracking-tight text-white italic">{f.name}</span>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{f.facultyId}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                                <button
                                    onClick={fetchFaculty}
                                    className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 hover:text-indigo-300 transition-all border border-indigo-400/20 rounded-2xl hover:bg-indigo-400/5"
                                >
                                    Force Registry Refresh
                                </button>
                           </div>
                        </div>
                    </div>
                    {/* Registry List (Right/Bottom) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden h-fit">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950 border-b-2 border-slate-100 dark:border-slate-800">
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Personnel Node</th>
                                            <th className="hidden sm:table-cell px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sector</th>
                                            <th className="hidden md:table-cell px-8 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Load</th>
                                            <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Directives</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="px-10 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <RotateCcw className="w-12 h-12 text-indigo-500 animate-spin" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Accessing Personnel Mainframe...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : faculty.length > 0 ? (
                                            faculty.map((f, i) => (
                                                <tr key={f.id} className="group hover:bg-indigo-500/[0.02] transition-all duration-300">
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent group-hover:border-indigo-500/20 flex items-center justify-center font-[1000] text-slate-900 dark:text-white uppercase transition-all group-hover:scale-110 italic shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-500/10">
                                                                {f.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-[1000] text-slate-900 dark:text-white uppercase tracking-tight italic group-hover:text-indigo-500 transition-colors">{f.name}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">{f.facultyId} · {f.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-8 py-8">
                                                        <span className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest italic group-hover:bg-indigo-500/10 group-hover:text-indigo-500 group-hover:border-indigo-500/20 transition-all">
                                                            {f.department || "CORE DIV"}
                                                        </span>
                                                    </td>
                                                    <td className="hidden md:table-cell px-8 py-8">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <span className={`text-xl font-[1000] italic ${f.menteeCount > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                                {f.menteeCount || 0}
                                                            </span>
                                                            <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                                <div 
                                                                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-700" 
                                                                    style={{ width: `${Math.min((f.menteeCount || 0) * 10, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <button
                                                                onClick={() => navigate("/admin/assign-mentor", { state: { facultyId: f.id, facultyName: f.name } })}
                                                                className="px-6 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all whitespace-nowrap"
                                                            >
                                                                Sync Mentees
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteFaculty(f.id, f.name)}
                                                                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
                                                                title="Revoke Node Access"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-10 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ShieldAlert className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">No entities detected in sector registry.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="p-10 rounded-[3.5rem] bg-indigo-500/5 border-2 border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group/tip">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -ml-16 -mt-16"></div>
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover/tip:scale-110 transition-transform">
                                    <Terminal className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-indigo-900/60 dark:text-indigo-400/60 uppercase tracking-widest leading-relaxed max-w-lg">
                                    Finalizing a node removal will <span className="text-indigo-500 font-black">unassign all subordinate entities</span> from the mainframe. Permanent data integrity is maintained.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate("/admin/assign-mentor")}
                                className="relative z-10 px-8 py-4 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                            >
                                Global Synchronization →
                            </button>
                        </div>
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
