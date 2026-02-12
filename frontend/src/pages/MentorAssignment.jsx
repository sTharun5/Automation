import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

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
    const [message, setMessage] = useState("");
    const { showToast } = useToast();

    // Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        isDanger: false
    });

    // Real-time Faculty Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (facultyQuery.length > 2) {
                handleFacultySearch();
            } else if (facultyQuery === "") {
                setFaculties([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [facultyQuery]);

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
    }, [studentQuery]);

    /* ================= SEARCH FACULTY ================= */
    const handleFacultySearch = async () => {
        try {
            setIsSearchingFaculty(true);
            const res = await api.get(`/admin/search-faculty?q=${facultyQuery}`);
            setFaculties(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearchingFaculty(false);
        }
    };

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
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mentor Assignment</h1>
                        <p className="text-slate-600 dark:text-slate-400">Assign faculty mentors to students in bulk.</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        <span>←</span> Back
                    </button>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl animate-fadeIn">
                        ✅ {message}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* STEP 1: SELECT FACULTY */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">1</span>
                            Select Faculty Mentor
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Search by name or Faculty ID..."
                                value={facultyQuery}
                                onChange={(e) => setFacultyQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleFacultySearch()}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <button
                                onClick={handleFacultySearch}
                                className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-white font-medium"
                            >
                                Search
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px] flex flex-col">
                            {isSearchingFaculty ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-blue-500 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Searching Faculty...</p>
                                </div>
                            ) : faculties.length > 0 ? (
                                faculties.map((f) => (
                                    <div
                                        key={f.id}
                                        onClick={() => setSelectedFaculty(f)}
                                        className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedFaculty?.id === f.id
                                            ? "bg-blue-50 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500 shadow-sm"
                                            : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800"
                                            }`}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white capitalize">{f.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{f.facultyId} • {f.department || "N/A"}</p>
                                        </div>
                                        {selectedFaculty?.id === f.id && <span className="text-blue-600 dark:text-blue-400">✔️</span>}
                                    </div>
                                ))
                            ) : facultyQuery.length > 0 && facultyQuery.length <= 2 ? (
                                <p className="text-center text-slate-400 text-xs py-8 italic font-medium">Keep typing to search...</p>
                            ) : facultyQuery.length > 2 ? (
                                <p className="text-center text-slate-500 text-sm py-8 font-medium">No faculty member found matching "{facultyQuery}"</p>
                            ) : (
                                <p className="text-center text-slate-500 text-sm py-8 font-medium">Type a name or ID above to find a mentor</p>
                            )}
                        </div>
                    </div>

                    {/* STEP 2: SELECT STUDENTS */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">2</span>
                            Select Students
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Search by Roll No or Name..."
                                value={studentQuery}
                                onChange={(e) => setStudentQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                            <button
                                onClick={handleStudentSearch}
                                className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg text-white font-medium"
                            >
                                Search
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px] flex flex-col">
                            {isSearchingStudent ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-blue-500 animate-pulse">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p className="text-xs font-bold uppercase tracking-widest">Searching Students...</p>
                                </div>
                            ) : students.length > 0 ? (
                                students.map((s) => {
                                    const isSelected = selectedStudents.find((sel) => sel.id === s.id);
                                    return (
                                        <div
                                            key={s.id}
                                            className={`p-3 border rounded-xl transition-all flex justify-between items-center ${isSelected
                                                ? "bg-blue-50 border-blue-400 dark:bg-blue-900/40 dark:border-blue-500 shadow-sm"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800"
                                                }`}
                                        >
                                            <div onClick={() => toggleStudentSelection(s)} className="flex-1 cursor-pointer">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{s.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.rollNo} • {s.department}</p>
                                                    {s.mentor && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold uppercase">
                                                            Assigned: {s.mentor.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {s.mentor && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveMentor(s.id);
                                                        }}
                                                        title="Remove Mentor"
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                                <div
                                                    onClick={() => toggleStudentSelection(s)}
                                                    className={`h-5 w-5 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600"
                                                        }`}>
                                                    {isSelected && "✓"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : studentQuery.length > 0 && studentQuery.length <= 2 ? (
                                <p className="text-center text-slate-400 text-xs py-8 italic font-medium">Keep typing to search...</p>
                            ) : studentQuery.length > 2 ? (
                                <p className="text-center text-slate-500 text-sm py-8 font-medium">No students found matching "{studentQuery}"</p>
                            ) : (
                                <p className="text-center text-slate-500 text-sm py-8 font-medium">Type a name or Roll No above to find students</p>
                            )}
                        </div>

                        {/* Selection Summary */}
                        {selectedStudents.length > 0 && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selected ({selectedStudents.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedStudents.map((s) => (
                                        <span key={s.id} className="text-[10px] bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                            {s.rollNo}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Action */}
                <div className="mt-10 flex flex-col items-center">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-lg shadow-slate-200/50 dark:shadow-none">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-center">Summary</h4>
                        <div className="space-y-3 text-sm mb-6">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Mentor:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedFaculty?.name || "None Selected"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Students:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedStudents.length} selected</span>
                            </div>
                        </div>
                        <button
                            onClick={handleAssign}
                            disabled={loading || !selectedFaculty || selectedStudents.length === 0}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${loading || !selectedFaculty || selectedStudents.length === 0
                                ? "bg-slate-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                                }`}
                        >
                            {loading ? "Assigning..." : "Assign Mentor"}
                        </button>
                    </div>
                </div>
            </main>
            <ConfirmationModal
                {...confirmModal}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
            <Footer />
        </div >
    );
}
