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
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1 transition-colors text-sm font-bold uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Coordinated Events</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Manage student delegations and approve event rosters.</p>
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
                            <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex gap-2">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${event.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                                                {event.status}
                                            </span>
                                            {new Date(event.endDate) < new Date() && (
                                                <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 border border-red-200 dark:border-red-800 animate-pulse">
                                                    Expired
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{event.eventId}</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{event.name}</h2>

                                    <div className="space-y-2 mb-6 text-sm font-medium">
                                        <p className="text-slate-600 dark:text-slate-400">Capacity: <span className="font-bold text-slate-900 dark:text-white">{event.maxParticipants > 0 ? event.maxParticipants : 'Unlimited'} Students</span></p>
                                        <p className="text-slate-600 dark:text-slate-400">Date: <span className="font-bold text-slate-900 dark:text-white">{new Date(event.startDate).toLocaleDateString()}</span></p>
                                        <p className="text-slate-600 dark:text-slate-400">OD Value: <span className="font-bold text-indigo-500">{Math.floor(event.allocatedHours)}h {Math.round((event.allocatedHours % 1) * 60)}m</span></p>
                                    </div>

                                    {!event.studentCoordinatorId ? (
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <UserPlus className="w-4 h-4" /> Assign Student Coordinator
                                            </p>
                                            <div className="flex flex-col md:flex-row gap-3 items-end">
                                                <div className="flex-1">
                                                    <SearchableSelect
                                                        placeholder="Type roll no or name..."
                                                        value={assigningRollNo[event.id] || ''}
                                                        isAsync={true}
                                                        onSearch={async (q) => {
                                                            const res = await api.get(`/admin/search-students?q=${q}`);
                                                            return res.data.map(s => ({
                                                                value: s.rollNo, // Backend currently expects rollNo here
                                                                label: s.name,
                                                                sublabel: `${s.rollNo} • ${s.department}`,
                                                                icon: <User className="w-4 h-4" />
                                                            }));
                                                        }}
                                                        onChange={(val) => setAssigningRollNo(prev => ({ ...prev, [event.id]: val }))}
                                                    />
                                                </div>
                                                <div className="flex-[2]">
                                                    <input
                                                        type="text"
                                                        placeholder="Reason (e.g. Event Lead)"
                                                        value={assigningReason[event.id] || ''}
                                                        onChange={(e) => setAssigningReason(prev => ({ ...prev, [event.id]: e.target.value }))}
                                                        className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleAssignCoordinator(event.id)}
                                                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap flex items-center gap-2 group"
                                                >
                                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                                    Assign
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-full font-black text-lg">
                                                        {event.studentCoordinator?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Designated Coordinator</p>
                                                        <p className="font-bold text-slate-900 dark:text-white">{event.studentCoordinator?.name}</p>
                                                        <p className="text-xs font-medium text-slate-400">{event.studentCoordinator?.rollNo}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeCoordinator(event.id)}
                                                    className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors border border-red-100 dark:border-red-900/30 flex items-center gap-1"
                                                    title="Revoke Coordinator Access"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" /> Revoke Access
                                                </button>
                                            </div>

                                            {!event.isRosterApproved ? (
                                                <div className={`p-5 rounded-2xl border ${event.isRosterSubmitted ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <p className={`text-sm font-bold flex items-center gap-2 ${event.isRosterSubmitted ? 'text-amber-900 dark:text-amber-400' : 'text-slate-500'}`}>
                                                                {event.isRosterSubmitted ? (
                                                                    <>
                                                                        <span className="relative flex h-3 w-3">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                                                        </span>
                                                                        Pending Roster Approval
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                                                                        Awaiting Student Submission
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="text-xs font-medium text-slate-500/70 dark:text-slate-400/70 mt-1">
                                                                {event.isRosterSubmitted
                                                                    ? "Student Coordinator has submitted the participant draft."
                                                                    : "Student Coordinator is currently drafting the participant list."}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                                            <button
                                                                onClick={() => handleViewRoster(event.id, event.name)}
                                                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View Roster
                                                            </button>
                                                            <button
                                                                onClick={() => handleApproveRoster(event.id)}
                                                                disabled={!event.isRosterSubmitted}
                                                                className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 ${event.isRosterSubmitted
                                                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none"
                                                                    }`}
                                                            >
                                                                {event.isRosterSubmitted ? <><CheckCircle2 className="w-4 h-4" /> Approve</> : <><Clock className="w-4 h-4" /> Pending Submission</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                                                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Roster Approved & Locked</p>
                                                            <p className="text-xs font-medium text-emerald-700/70 dark:text-emerald-500/70 mt-1">PROVISIONAL passes have been distributed to all participants.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewRoster(event.id, event.name)}
                                                            className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800 flex items-center gap-2"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> View Roster
                                                        </button>
                                                    </div>
                                                    {event.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => startProjection(event)}
                                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02] flex items-center justify-center gap-3 mt-4"
                                                        >
                                                            <MonitorPlay className="w-6 h-6" /> Project Live QR & OTP
                                                        </button>
                                                    )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Event Roster</h3>
                                <p className="text-xs font-bold text-slate-500 mt-1">{currentEventName}</p>
                            </div>
                            <button onClick={() => setViewingRoster(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {rosterLoading ? (
                                <div className="py-12 text-center animate-pulse text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    Loading Roster Data...
                                </div>
                            ) : rosterData.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider">
                                    No students mapped to this event yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <div className="w-12">No.</div>
                                        <div className="flex-1">Student</div>
                                        <div className="w-24 text-right">Dept</div>
                                    </div>
                                    {rosterData.roster && rosterData.roster.map((student, idx) => (
                                        <div key={student.rollNo} className="flex items-center text-sm px-4 py-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                            <div className="w-12 font-bold text-slate-400">{idx + 1}</div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white capitalize">{student.name.toLowerCase()}</p>
                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{student.rollNo}</p>
                                            </div>
                                            <div className="w-24 text-right font-bold text-slate-600 dark:text-slate-400 text-xs uppercase">
                                                {student.department}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Total: {rosterData.roster?.length || 0}
                            </span>
                            <button
                                onClick={() => setViewingRoster(false)}
                                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULLSCREEN PROJECTION OVERLAY */}
            {projectingEvent && (
                <div className="fixed inset-0 z-[99999] bg-[#0f172a] flex flex-col items-center justify-center p-8 animate-fadeIn">

                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                        <div>
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Live Projection
                            </span>
                        </div>
                        <button onClick={stopProjection} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold uppercase tracking-wider backdrop-blur-md transition-colors">
                            End Projection
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="text-center max-w-4xl w-full mx-auto flex flex-col items-center mt-12">
                        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl">
                            {projectingEvent.name}
                        </h1>
                        <p className="text-lg md:text-2xl text-slate-300 font-medium mb-12">
                            Scan to instantly log your attendance & OD.
                        </p>

                        {/* The QR Code Wrapper */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                            {/* QR Block */}
                            <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/20 flex flex-col items-center justify-center">
                                {qrData ? (
                                    <img src={qrData} alt="Live QR Code" className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] object-contain rendering-pixelated" />
                                ) : (
                                    <div className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {/* Security Ring */}
                                <div className="absolute -inset-4 border-2 border-indigo-500/30 rounded-[2.5rem] pointer-events-none"></div>
                            </div>

                            {/* OTP Status Block */}
                            {eventOtp && (
                                <div className="flex flex-col items-center p-8 bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">SCAN OR ENTER CODE</p>
                                    <div className="flex gap-2 mb-4">
                                        {eventOtp.split('').map((char, index) => (
                                            <div key={index} className="w-12 md:w-16 h-16 md:h-20 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-3xl md:text-5xl font-mono font-black text-indigo-400 shadow-inner">
                                                {char}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-indigo-300/60 text-xs font-mono">Refreshes dynamically</p>
                                </div>
                            )}
                        </div>

                        {/* Security Footer */}
                        <div className="mt-12 flex items-center gap-3 text-slate-400 bg-white/5 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Lock className="w-6 h-6 text-indigo-400" />
                            <div className="text-left">
                                <p className="text-xs font-bold uppercase tracking-widest">Temporal Security Active</p>
                                <p className="text-[10px] uppercase tracking-wider opacity-70">Code refreshes dynamically to prevent proxy scanning.</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
