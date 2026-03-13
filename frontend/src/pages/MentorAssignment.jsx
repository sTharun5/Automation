import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import SearchableSelect from "../components/SearchableSelect";
import {
    ArrowLeft,
    Search,
    UserCircle2,
    Trash2,
    CheckCircle2,
    Users,
    ChevronRight,
    UserCheck,
    GraduationCap
} from "lucide-react";

export default function MentorAssignment() {
    const navigate = useNavigate();
    const location = useLocation();

    // Handle pre-selected data from navigation state
    useEffect(() => {
        if (location.state?.facultyId && location.state?.facultyName) {
            setSelectedFaculty({
                id: location.state.facultyId,
                name: location.state.facultyName
            });
        }
        if (location.state?.preSelectedStudent) {
            const student = location.state.preSelectedStudent;
            setSelectedStudents((prev) => {
                if (prev.find(s => s.id === student.id)) return prev;
                return [...prev, student];
            });
        }
    }, [location.state]);

    // Faculty Search
    const [facultyQuery, setFacultyQuery] = useState("");
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [isSearchingFaculty, setIsSearchingFaculty] = useState(false);

    // Student Search
    const [studentQuery, setStudentQuery] = useState("");
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isSearchingStudent, setIsSearchingStudent] = useState(false);

    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    // Real-time Student Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (studentQuery.length > 2) {
                handleStudentSearch();
            } else if (studentQuery === "") {
                setStudents([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentQuery]);


    /* ================= SEARCH STUDENTS ================= */
    const handleStudentSearch = async () => {
        try {
            setIsSearchingStudent(true);
            const res = await api.get(`/students/search?q=${studentQuery}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingStudent(false);
        }
    };

    /* ================= TOGGLE STUDENT SELECTION ================= */
    const toggleStudentSelection = (student) => {
        if (selectedStudents.find((s) => s.id === student.id)) {
            setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
        } else {
            setSelectedStudents([...selectedStudents, student]);
        }
    };

    /* ================= REMOVE MENTOR ================= */
    const confirmRemoveMentor = async (studentId) => {
        try {
            setLoading(true);
            await api.put("/admin/remove-mentor", { studentId });
            showToast("Mentor removed successfully", "success");
            handleStudentSearch(); // Refresh list
        } catch (err) {
            console.error(err);
            showToast("Removal failed", "error");
        } finally {
            setLoading(false);
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleRemoveMentor = (studentId) => {
        setConfirmModal({
            isOpen: true,
            title: "Unassign Mentor",
            message: "Are you sure you want to remove the mentor from this student?",
            onConfirm: () => confirmRemoveMentor(studentId),
            isDanger: true,
            confirmText: "Yes, Remove"
        });
    };

    /* ================= SUBMIT ASSIGNMENT ================= */
    const performAssignment = async () => {
        try {
            setLoading(true);
            await api.put("/admin/assign-mentor", {
                mentorId: selectedFaculty.id,
                studentIds: selectedStudents.map((s) => s.id)
            });
            showToast(`Successfully assigned ${selectedStudents.length} students to ${selectedFaculty.name}`, "success");
            setSelectedFaculty(null);
            setSelectedStudents([]);
            setFaculties([]);
            setStudents([]);
        } catch (err) {
            showToast(err.response?.data?.message || "Assignment failed", "error");
        } finally {
            setLoading(false);
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleAssign = () => {
        if (!selectedFaculty || selectedStudents.length === 0) {
            showToast("Please select a faculty and at least one student", "warning");
            return;
        }

        const hasAssigned = selectedStudents.some(s => s.mentor);
        if (hasAssigned) {
            setConfirmModal({
                isOpen: true,
                title: "Reassign Students",
                message: "Some selected students already have a mentor. Are you sure you want to reassign them?",
                onConfirm: performAssignment,
                isDanger: false,
                confirmText: "Yes, Reassign"
            });
        } else {
            performAssignment();
        }
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
                                Mentor <span className="text-indigo-500">Assignment</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.05em] max-w-2xl">
                                Strategic mentorship synchronization. Pair sector liaisons with subordinate entities to establish operational authorization and audit chains.
                            </p>
                        </div>
                    </div>

                    <div className="hidden xl:flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-500 animate-pulse">
                            <UserCheck className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* STEP 1: SELECT FACULTY */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="p-10 md:p-12 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group/form">
                           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[100px] -mr-24 -mt-24 group-hover/form:bg-indigo-500/10 transition-colors"></div>
                           
                           <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                        <span className="text-xl font-[1000] italic">01</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Liaison Authority</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Select Primary Mentor</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <SearchableSelect
                                        placeholder="ESTABLISH LINK: NAME OR ID..."
                                        value={selectedFaculty?.id}
                                        isAsync={true}
                                        className="rounded-3xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 py-4"
                                        onSearch={async (q) => {
                                            const res = await api.get(`/admin/search-faculty?q=${q}`);
                                            return res.data.map(f => ({
                                                value: f.id,
                                                label: f.name,
                                                sublabel: `${f.facultyId} • ${f.department || 'GENERAL SECTOR'}`,
                                                icon: <GraduationCap className="w-5 h-5 text-indigo-500" />,
                                                original: f
                                            }));
                                        }}
                                        onChange={(val, opt) => {
                                            if (opt?.original) {
                                                setSelectedFaculty(opt.original);
                                            }
                                        }}
                                    />

                                    {selectedFaculty && (
                                        <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border-2 border-indigo-500/20 flex items-center justify-between group/card transition-all hover:bg-indigo-500/10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-2xl font-[1000] italic shadow-xl shadow-indigo-500/20 transition-transform group-hover/card:scale-110">
                                                    {selectedFaculty.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-lg font-[1000] text-slate-900 dark:text-white uppercase tracking-tight italic">{selectedFaculty.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedFaculty.facultyId} • {selectedFaculty.department}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedFaculty(null)}
                                                className="p-3 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                           </div>
                        </div>

                        {/* SUB-INFO BOX */}
                        <div className="p-8 rounded-[3rem] bg-slate-900 border-2 border-white/5 text-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group/info">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[80px] -mr-16 -mt-16 group-hover/info:bg-indigo-500/10 transition-colors pointer-events-none"></div>
                           <div className="flex items-center gap-6">
                                <Users className="w-8 h-8 text-indigo-500" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Direct Command</p>
                                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1 italic">Assigning a mentor establishes direct oversight over all selected student entities.</p>
                                </div>
                           </div>
                        </div>
                        </div>
                    </div>

                    {/* STEP 2: SELECT STUDENTS */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="p-10 md:p-12 rounded-[4rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group/students">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[100px] -mr-24 -mt-24 group-hover/students:bg-indigo-500/10 transition-colors"></div>
                            
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                                            <span className="text-xl font-[1000] italic">02</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Subordinate Entities</h2>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Select Targeted Students</p>
                                        </div>
                                    </div>
                                    {selectedStudents.length > 0 && (
                                        <div className="px-5 py-2 rounded-full bg-indigo-500 text-white text-[10px] font-[1000] uppercase tracking-widest animate-bounce">
                                            {selectedStudents.length} Ready
                                        </div>
                                    )}
                                </div>

                                <div className="relative group/search">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors pointer-events-none">
                                        <Search className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="SEARCH NODES: ROLL NO OR NAME..."
                                        value={studentQuery}
                                        onChange={(e) => setStudentQuery(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-3xl pl-16 pr-6 py-5 text-sm font-bold placeholder:text-slate-300 focus:border-indigo-500/50 outline-none transition-all text-slate-900 dark:text-white italic"
                                    />
                                </div>

                                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar min-h-[200px] flex flex-col">
                                    {isSearchingStudent ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20">
                                            <RotateCcw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Scanning Node Network...</p>
                                        </div>
                                    ) : students.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {students.map((s) => {
                                                const isSelected = selectedStudents.find((sel) => sel.id === s.id);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => toggleStudentSelection(s)}
                                                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group/item relative overflow-hidden ${isSelected
                                                            ? "bg-indigo-500/5 border-indigo-500 shadow-xl shadow-indigo-500/10"
                                                            : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30"
                                                        }`}
                                                    >
                                                        <div className="relative z-10 flex flex-col gap-4">
                                                            <div className="flex justify-between items-start">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-[1000] italic transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-slate-900 text-indigo-500 border border-slate-100 dark:border-slate-800'}`}>
                                                                    {s.name.charAt(0)}
                                                                </div>
                                                                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white scale-110' : 'border-slate-200 dark:border-slate-700'}`}>
                                                                    {isSelected && <CheckCircle2 className="w-3 h-3" />}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className={`font-[1000] uppercase tracking-tight italic transition-colors ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{s.name}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.rollNo} · {s.department}</p>
                                                            </div>
                                                            {s.mentor && (
                                                                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                                    <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                                                                        Linked: {s.mentor.name}
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRemoveMentor(s.id);
                                                                        }}
                                                                        className="ml-auto p-1 hover:text-rose-500 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : studentQuery.length > 0 && studentQuery.length <= 2 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic text-center px-10">Neural input too short. Continue scanning...</p>
                                        </div>
                                    ) : studentQuery.length > 2 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-rose-500/20 rounded-[3rem]">
                                            <ShieldAlert className="w-10 h-10 text-rose-500/30 mb-4" />
                                            <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-[0.4em] italic text-center px-10 text-balance">Negative search results. Profile "{studentQuery}" not found.</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                                            <GraduationCap className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-4" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic text-center px-10 text-balance">Awaiting neural query. Search Roll No or Name to begin node selection.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                    </div>
                </div>

                {/* Final Action / Summary Layer */}
                <div className="flex justify-center px-4">
                    <div className="w-full max-w-4xl p-10 md:p-12 rounded-[4rem] bg-slate-900 border-2 border-white/5 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group/summary">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[120px] -ml-32 -mb-32"></div>

                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Directives Overview</p>
                                <h3 className="text-3xl font-[1000] italic uppercase tracking-tighter">Synchronization <span className="text-indigo-500">Log</span></h3>
                            </div>

                            <div className="space-y-6 md:border-x-2 md:border-white/5 px-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Authority</span>
                                    <span className="text-sm font-black text-indigo-400 italic truncate ml-4">
                                        {selectedFaculty?.name || "UNASSIGNED"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Entities</span>
                                    <span className="text-sm font-black text-white italic">
                                        {selectedStudents.length} NODES
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all duration-1000" 
                                        style={{ width: selectedFaculty && selectedStudents.length > 0 ? '100%' : '20%' }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={handleAssign}
                                disabled={loading || !selectedFaculty || selectedStudents.length === 0}
                                className={`group/btn relative overflow-hidden h-20 rounded-3xl font-[1000] uppercase tracking-[0.3em] text-[12px] italic transition-all active:scale-95 ${
                                    loading || !selectedFaculty || selectedStudents.length === 0
                                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                                    : "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-600"
                                }`}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    {loading ? (
                                        <RotateCcw className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Finalize Assignment <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" /></>
                                    )}
                                </span>
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
