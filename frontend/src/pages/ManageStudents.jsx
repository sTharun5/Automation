import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ManageStudents() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get("/admin/all-students");
            setStudents(res.data);
        } catch (err) {
            alert("Failed to fetch student list");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMentor = async (studentId) => {
        if (!window.confirm("Are you sure you want to remove the mentor for this student?")) return;
        try {
            await api.put("/admin/remove-mentor", { studentId });
            fetchStudents(); // Refresh list
        } catch (err) {
            alert("Removal failed");
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
                    <button
                        onClick={() => navigate("/admin/assign-mentor")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <span>🤝</span> Assign Mentors
                    </button>
                </div>

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
                                                {s.placement_status?.status === "PLACED" ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase">Placed</span>
                                                ) : s.placement_status?.status === "NIP" ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">NIP</span>
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
            <Footer />
        </div>
    );
}
