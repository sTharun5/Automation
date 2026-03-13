import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import SearchableSelect from '../components/SearchableSelect';
import {
    ArrowLeft,
    Calendar,
    User,
    Plus,
    Eye,
    CheckCircle2,
    MonitorPlay,
    X,
    Lock,
    ShieldAlert,
    Clock,
    UserPlus,
    UserMinus,
    AlertCircle
} from 'lucide-react';

export default function FacultyEvents() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigningRollNo, setAssigningRollNo] = useState({});
    const [assigningReason, setAssigningReason] = useState({});

    // Roster Modal State
    const [viewingRoster, setViewingRoster] = useState(false);
    const [rosterData, setRosterData] = useState([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [currentEventName, setCurrentEventName] = useState("");

    // Projection State
    const [projectingEvent, setProjectingEvent] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [eventOtp, setEventOtp] = useState(null);
    const projectionInterval = useRef(null);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/internal/my-assigned');
            setEvents(res.data);
        } catch (error) {
            console.error("Fetch assigned events error", error);
            showToast("Failed to load your assigned events.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 10000); // Poll every 10s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAssignCoordinator = async (eventId) => {
        const rollNo = assigningRollNo[eventId];
        const reason = assigningReason[eventId];
        if (!rollNo) return showToast("Please enter a Roll Number", "error");
        if (!reason) return showToast("Please provide a reason for assignment", "error");

        try {
            await api.post(`/events/${eventId}/assign-coordinator`, { rollNo, reason });
            showToast("Student Coordinator assigned successfully!", "success");
            setAssigningRollNo(prev => ({ ...prev, [eventId]: '' }));
            setAssigningReason(prev => ({ ...prev, [eventId]: '' }));
            fetchEvents();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to assign coordinator", "error");
        }
    };

    const handleRevokeCoordinator = async (eventId) => {
        if (!window.confirm("Are you sure you want to revoke this student's coordinator access?")) return;

        const reason = window.prompt("Reason for revocation (Required):");
        if (reason === null) return; // User cancelled prompt
        if (!reason.trim()) return showToast("Reason is required to revoke coordinator access", "error");

        try {
            await api.put(`/events/${eventId}/revoke-coordinator`, { reason });
            showToast("Student Coordinator access revoked successfully.", "success");
            fetchEvents();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to revoke coordinator", "error");
        }
    };

    const handleApproveRoster = async (eventId) => {
        try {
            await api.post(`/events/${eventId}/approve-roster`);
            showToast("Roster officially approved. Digital Gate Passes generated!", "success");
            fetchEvents();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to approve roster", "error");
        }
    };

    const handleViewRoster = async (eventId, eventName) => {
        setViewingRoster(true);
        setRosterLoading(true);
        setCurrentEventName(eventName);
        try {
            const res = await api.get(`/events/${eventId}/roster`);
            setRosterData(res.data); // Store full object { isApproved, roster, count }
        } catch (error) {
            showToast("Failed to fetch roster details", "error");
            setViewingRoster(false);
        } finally {
            setRosterLoading(false);
        }
    };

    // --- QR Projection Logic ---
    const startProjection = async (event) => {
        setProjectingEvent(event);
        await fetchLiveQR(event.id);

        // Setup polling every 10 seconds to ensure QR is always fresh before TOTP expires
        projectionInterval.current = setInterval(() => {
            fetchLiveQR(event.id);
        }, 10000);
    };

    const stopProjection = () => {
        setProjectingEvent(null);
        setQrData(null);
        setEventOtp(null);
        if (projectionInterval.current) {
            clearInterval(projectionInterval.current);
        }
    };

    const fetchLiveQR = async (eventId) => {
        try {
            const res = await api.get(`/events/${eventId}/live-qr`);
            setQrData(res.data.qrData);
            setEventOtp(res.data.otp);
        } catch (error) {
            console.error("QR Fetch Error:", error);
            showToast("Failed to refresh live QR", "error");
            stopProjection();
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
            <Header />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-blue-600 mb-4 flex items-center gap-1 transition-colors text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] active:scale-95">
                        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Back to Dashboard
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Coordinated Events</h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">Manage student delegations and approve event rosters.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse font-bold text-slate-400 uppercase tracking-widest">Loading Events...</div>
                    ) : events.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-wider">No events assigned to you yet.</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col gap-6 sm:gap-8 hover:border-indigo-500/20">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex gap-2">
                                            <span className={`px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg ${event.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                                                {event.status}
                                            </span>
                                            {new Date(event.endDate) < new Date() && (
                                                <span className="px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 animate-pulse">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">{event.eventId}</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{event.name}</h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6">
                                        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'} Students</p>
                                        </div>
                                        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(event.startDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Applied Weightage</p>
                                            <p className="text-xs sm:text-sm font-bold text-indigo-500">{Math.floor(event.allocatedHours)}h {Math.round((event.allocatedHours % 1) * 60)}m</p>
                                        </div>
                                    </div>

                                    {!event.studentCoordinatorId ? (
                                        <div className="p-5 sm:p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-[1.5rem] relative overflow-hidden group/form">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover/form:bg-blue-500/10 transition-colors"></div>
                                            <p className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2 relative z-10">
                                                <UserPlus className="w-3.5 h-3.5" /> Delegate Student Coordinator
                                            </p>
                                            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end relative z-10">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Search Student</p>
                                                    <SearchableSelect
                                                        placeholder="Name or Roll Number..."
                                                        value={assigningRollNo[event.id] || ''}
                                                        isAsync={true}
                                                        onSearch={async (q) => {
                                                            const res = await api.get(`/admin/search-students?q=${q}`);
                                                            return res.data.map(s => ({
                                                                value: s.rollNo,
                                                                label: s.name,
                                                                sublabel: `${s.rollNo} • ${s.department}`,
                                                                icon: <User className="w-4 h-4" />
                                                            }));
                                                        }}
                                                        onChange={(val) => setAssigningRollNo(prev => ({ ...prev, [event.id]: val }))}
                                                    />
                                                </div>
                                                <div className="flex-[1.5] min-w-0">
                                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Assignment Reason</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Describe role (e.g. Lead Coordinator)"
                                                        value={assigningReason[event.id] || ''}
                                                        onChange={(e) => setAssigningReason(prev => ({ ...prev, [event.id]: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-400 transition-all focus:border-blue-500"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleAssignCoordinator(event.id)}
                                                    className="w-full lg:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
                                                >
                                                    <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                                                    Confirm Assignment
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl group/coord">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-full font-black text-lg sm:text-xl shadow-inner group-hover/coord:scale-105 transition-transform">
                                                        {event.studentCoordinator?.name?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lead Coordinator</p>
                                                        <p className="font-black text-slate-900 dark:text-white truncate text-sm sm:text-base">{event.studentCoordinator?.name}</p>
                                                        <p className="text-[10px] sm:text-xs font-bold text-slate-500/70 truncate uppercase tracking-widest">{event.studentCoordinator?.rollNo} • {event.studentCoordinator?.department}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeCoordinator(event.id)}
                                                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 active:scale-95"
                                                    title="Revoke Coordinator Access"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" /> Revoke
                                                </button>
                                            </div>

                                            {!event.isRosterApproved ? (
                                                <div className={`p-5 sm:p-6 rounded-2xl border ${event.isRosterSubmitted ? 'bg-amber-50/50 dark:bg-amber-900/5 border-amber-200 dark:border-amber-900/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'}`}>
                                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                        <div className="min-w-0">
                                                            <div className={`text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2.5 ${event.isRosterSubmitted ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                                                                {event.isRosterSubmitted ? (
                                                                    <>
                                                                        <span className="relative flex h-2.5 w-2.5">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                                        </span>
                                                                        Roster Awaiting Review
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                                                                        Drafting Phase
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] sm:text-xs font-bold text-slate-500/70 dark:text-slate-400/60 mt-2 leading-relaxed">
                                                                {event.isRosterSubmitted
                                                                    ? "The student coordinator has submitted the participant list for your final verification and approval."
                                                                    : "Participants have not yet been submitted. The coordinator is still finalizing the roster draft."}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center xl:shrink-0">
                                                            <button
                                                                onClick={() => handleViewRoster(event.id, event.name)}
                                                                className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                                                            >
                                                                <Eye className="w-4 h-4 text-slate-400" /> View Roster
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveRoster(event.id)}
                                                                disabled={!event.isRosterSubmitted}
                                                                className={`flex-1 sm:flex-none px-6 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 ${event.isRosterSubmitted
                                                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                                                                    }`}
                                                            >
                                                                {event.isRosterSubmitted ? <><CheckCircle2 className="w-4 h-4" /> Approve & Lock</> : <><Clock className="w-4 h-4" /> Waiting...</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-5 sm:p-6 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/20 rounded-[1.5rem] flex flex-col gap-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center shrink-0">
                                                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Roster Verified</p>
                                                            <p className="text-[10px] sm:text-xs font-bold text-emerald-700/60 dark:text-emerald-500/50 mt-1">Digital passes and weightage have been officially granted.</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            onClick={() => handleViewRoster(event.id, event.name)}
                                                            className="flex-1 px-5 py-3 bg-white dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-200 dark:border-emerald-800/30 flex items-center justify-center gap-2 active:scale-95"
                                                        >
                                                            <Eye className="w-4 h-4" /> View Full Roster
                                                        </button>
                                                        {event.status === 'ACTIVE' && (
                                                            <button
                                                                onClick={() => startProjection(event)}
                                                                className="flex-1 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                                                            >
                                                                <MonitorPlay className="w-4 h-4 sm:w-5 sm:h-5" /> Live Projection
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* View Roster Modal */}
            {viewingRoster && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slide-up">
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">Event Roster</h3>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest truncate">{currentEventName}</p>
                            </div>
                            <button onClick={() => setViewingRoster(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 shadow-sm transition-all active:scale-90 ml-4 group">
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {rosterLoading ? (
                                <div className="py-16 text-center animate-pulse text-xs sm:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                                    Deciphering Roster...
                                </div>
                            ) : rosterData.roster?.length === 0 ? (
                                <div className="py-16 text-center text-slate-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-60">No participants registered</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 px-4 pb-3 border-b border-slate-50 dark:border-slate-800/50 mb-4">
                                        <div className="w-10 sm:w-12">No.</div>
                                        <div className="flex-1">Participant Details</div>
                                        <div className="w-20 text-right">Dept</div>
                                    </div>
                                    {rosterData.roster && rosterData.roster.map((student, idx) => (
                                        <div key={student.rollNo} className="group flex items-center text-sm px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                                            <div className="w-10 sm:w-12 font-black text-slate-300 dark:text-slate-700 text-xs sm:text-sm">{String(idx + 1).padStart(2, '0')}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-900 dark:text-white truncate text-xs sm:text-sm uppercase tracking-tight">{student.name}</p>
                                                <p className="text-[10px] sm:text-xs font-bold text-slate-500/60 uppercase tracking-widest">{student.rollNo}</p>
                                            </div>
                                            <div className="w-20 text-right">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 rounded-md">
                                                    {student.department}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Delegation Strength</span>
                                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{rosterData.roster?.length || 0} <span className="text-xs text-slate-500 font-bold uppercase tracking-tight">Members</span></span>
                            </div>
                            <button
                                onClick={() => setViewingRoster(false)}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULLSCREEN PROJECTION OVERLAY */}
            {projectingEvent && (
                <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/5 pointer-events-none" />

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-4 sm:p-8 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 border border-rose-500/30 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em]">Live Stream</span>
                            </div>
                        </div>
                        <button 
                            onClick={stopProjection} 
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md transition-all border border-white/10 active:scale-95 shadow-2xl"
                        >
                            End Session
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="text-center max-w-5xl w-full mx-auto flex flex-col items-center mt-12 relative z-10 custom-scrollbar overflow-y-auto max-h-[calc(100vh-100px)]">
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl leading-[1.1]">
                            {projectingEvent.name}
                        </h1>
                        <p className="text-base sm:text-lg md:text-2xl text-slate-400 font-medium mb-10 sm:mb-16 tracking-tight">
                            Scan the unique matrix or enter the dynamic key to log attendance.
                        </p>

                        {/* The QR Code Wrapper */}
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 sm:gap-20 w-fit">
                            {/* QR Block */}
                            <div className="relative group">
                                <div className="absolute -inset-4 sm:-inset-6 bg-indigo-500/20 rounded-[2.5rem] sm:rounded-[4rem] blur-2xl group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
                                <div className="relative p-5 sm:p-8 bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl flex flex-col items-center justify-center transform hover:scale-[1.02] transition-transform duration-500 overflow-hidden">
                                    {qrData ? (
                                        <img src={qrData} alt="Live QR Code" className="w-[280px] sm:w-[380px] md:w-[450px] aspect-square object-contain rendering-pixelated rounded-2xl" />
                                    ) : (
                                        <div className="w-[280px] sm:w-[380px] md:w-[450px] aspect-square flex items-center justify-center bg-slate-50 rounded-2xl">
                                            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    {/* Subtle watermark */}
                                    <div className="mt-4 flex items-center gap-2 opacity-10">
                                        <ShieldAlert className="w-4 h-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Encrypted Stream</p>
                                    </div>
                                </div>
                            </div>

                            {/* OTP Status Block */}
                            {eventOtp && (
                                <div className="flex flex-col items-center p-8 sm:p-12 bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transform hover:translate-y-[-4px] transition-transform duration-500">
                                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs mb-8">Access Key</p>
                                    <div className="flex gap-2 sm:gap-4 mb-8">
                                        {eventOtp.split('').map((char, index) => (
                                            <div key={index} className="w-10 sm:w-16 md:w-24 h-14 sm:h-20 md:h-32 bg-slate-950/50 rounded-xl sm:rounded-3xl border border-white/5 flex items-center justify-center text-3xl sm:text-5xl md:text-8xl font-mono font-black text-indigo-400 shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        <p className="text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em]">Rotating dynamic key</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Security Footer */}
                        <div className="mt-12 sm:mt-24 flex flex-col sm:flex-row items-center gap-5 sm:gap-10 text-slate-500 mb-20 sm:mb-0">
                            <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Quantum Encryption</p>
                                    <p className="text-[9px] font-bold uppercase tracking-tight opacity-50">Secure multi-factor validation active</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-6 py-4">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">SMART-OD System v2.1</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
