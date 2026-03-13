import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import SearchableSelect from '../components/SearchableSelect';
import {
    ArrowLeft,
    Clock,
    X,
    Plus,
    MonitorPlay,
    Users,
    Eye,
    Pencil,
    Trash2,
    ScrollText,
    Mailbox,
    Lock,
    ShieldAlert,
    CheckCircle2,
    AlertCircle,
    User,
    GraduationCap,
    Bot,
    Info,
    Radio,
    Zap,
    Activity,
    Terminal,
    Layout,
    Smartphone,
    Search,
    Calendar,
    ChevronRight,
    QrCode,
    Sparkles
} from 'lucide-react';
import Footer from '../components/Footer';

export default function ManageInternalEvents() {
    const { showToast } = useToast();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPastEvents, setShowPastEvents] = useState(false);

    // Form State
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        allocatedHours: 2,
        maxParticipants: 0,
        staffCoordinatorId: '',
        studentCoordinatorId: ''
    });

    const [editingEvent, setEditingEvent] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        allocatedHours: 2,
        maxParticipants: 0,
        staffCoordinatorId: '',
        studentCoordinatorId: ''
    });

    // Projection State
    const [projectingEvent, setProjectingEvent] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [qrExpiresIn, setQrExpiresIn] = useState(0);
    const [eventOtp, setEventOtp] = useState(null); // ✅ Added OTP State
    const projectionInterval = useRef(null);

    // Attendance State
    const [attendanceData, setAttendanceData] = useState(null);
    const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

    // Deletion Modal State
    const [isDeletingId, setIsDeletingId] = useState(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Roster Modal State
    const [viewingRoster, setViewingRoster] = useState(false);
    const [rosterData, setRosterData] = useState([]);
    const [rosterLoading, setRosterLoading] = useState(false);
    const [currentEventName, setCurrentEventName] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Event Logs Modal State
    const [viewingLogs, setViewingLogs] = useState(false);
    const [logEvent, setLogEvent] = useState(null);

    // Auto-calculate OD hours based on start and end dates
    useEffect(() => {
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                // Precise calculation in minutes, minimum 60 mins (1 hr)
                const diffMinutes = Math.max(60, Math.floor(diffMs / (1000 * 60)));
                const diffHours = parseFloat((diffMinutes / 60).toFixed(2));

                // Optional cap: if an event spans multiple days (rare for internal), cap at 8 hours per day
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const cappedHours = (diffHours > diffDays * 8) ? diffDays * 8 : diffHours;

                setFormData(prev => prev.allocatedHours !== cappedHours ? { ...prev, allocatedHours: cappedHours } : prev);
            }
        }
    }, [formData.startDate, formData.endDate]);

    useEffect(() => {
        if (editFormData.startDate && editFormData.endDate) {
            const start = new Date(editFormData.startDate);
            const end = new Date(editFormData.endDate);
            if (end > start) {
                const diffMs = end.getTime() - start.getTime();
                const diffMinutes = Math.max(60, Math.floor(diffMs / (1000 * 60)));
                const diffHours = parseFloat((diffMinutes / 60).toFixed(2));

                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const cappedHours = (diffHours > diffDays * 8) ? diffDays * 8 : diffHours;

                setEditFormData(prev => prev.allocatedHours !== cappedHours ? { ...prev, allocatedHours: cappedHours } : prev);
            }
        }
    }, [editFormData.startDate, editFormData.endDate]);

    const fetchData = async () => {
        try {
            const [eventsRes, facultyRes] = await Promise.all([
                api.get(`/events/active?showPast=${showPastEvents}`),
                api.get('/admin/all-faculty')
            ]);
            setEvents(eventsRes.data);
            setFaculties(facultyRes.data.faculty || facultyRes.data);
        } catch (error) {
            console.error(error);
            showToast("Failed to load required data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPastEvents]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events/internal', formData);
            showToast("Internal event created successfully!", "success");
            setIsCreating(false);
            fetchData();
            setFormData({ name: '', startDate: '', endDate: '', allocatedHours: 2, maxParticipants: 0, staffCoordinatorId: '' });
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to create event", "error");
        }
    };

    const openEditModal = (event) => {
        const fDate = (dString) => {
            const d = new Date(dString);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        };
        setEditFormData({
            name: event.name,
            startDate: fDate(event.startDate),
            endDate: fDate(event.endDate),
            allocatedHours: event.allocatedHours,
            maxParticipants: event.maxParticipants || 0,
            staffCoordinatorId: event.staffCoordinatorId || '',
            studentCoordinatorId: event.studentCoordinatorId || ''
        });
        setEditingEvent(event);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/events/internal/${editingEvent.id}`, editFormData);
            showToast("Event updated successfully!", "success");
            setEditingEvent(null);
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to update event", "error");
        }
    };

    const confirmDelete = (eventId) => {
        setIsDeletingId(eventId);
    };

    const executeDelete = async () => {
        if (!isDeletingId) return;

        // Optimistic update: instantly hide the event for an ultra-fast feeling
        setEvents(prev => prev.filter(e => e.id !== isDeletingId));

        try {
            const res = await api.delete(`/events/internal/${isDeletingId}`);
            showToast(res.data?.message || "Event & ODs deleted successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete event", "error");
            fetchData(); // rollback optimistic update on failure
        } finally {
            setIsDeletingId(null);
        }
    };

    const confirmDeleteAll = () => {
        if (events.length === 0) {
            showToast("No active events to delete.", "info");
            return;
        }
        setIsDeletingAll(true);
    };

    const executeDeleteAll = async () => {
        // Optimistic update
        const previousEvents = [...events];
        setEvents([]);

        try {
            const res = await api.delete('/events/internal/all');
            showToast(res.data?.message || "All events deleted successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete events", "error");
            setEvents(previousEvents); // Rollback
            fetchData();
        } finally {
            setIsDeletingAll(false);
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
            setEventOtp(res.data.otp); // ✅ Store the OTP
            setQrExpiresIn(res.data.expiresIn);
        } catch (error) {
            console.error("QR Fetch Error:", error);
            showToast("Failed to refresh live QR", "error");
            stopProjection();
        }
    };

    // --- Attendance Fetching ---
    const fetchAttendance = async (event) => {
        setIsFetchingAttendance(true);
        showToast("Fetching attendance records...", "info");
        try {
            const res = await api.get(`/events/internal/${event.id}/attendance`);
            setAttendanceData(res.data);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to fetch event attendance", "error");
        } finally {
            setIsFetchingAttendance(false);
        }
    };

    // --- Roster Viewing ---
    const handleViewRoster = async (event) => {
        setViewingRoster(true);
        setRosterLoading(true);
        setCurrentEventName(event.name);
        setSelectedEvent(event);
        try {
            const res = await api.get(`/events/${event.id}/roster`);
            setRosterData(res.data); // Store the whole object { isApproved, count, roster }
        } catch (error) {
            showToast("Failed to fetch roster details", "error");
            setViewingRoster(false);
        } finally {
            setRosterLoading(false);
        }
    };

    const handleRevokeMentor = async (event) => {
        if (!event.staffCoordinator) return;
        const confirm = window.confirm(`Are you sure you want to revoke coordinator access for Prof. ${event.staffCoordinator.name}? This will also remove the student coordinator.`);
        if (!confirm) return;

        const reason = window.prompt("Reason for revocation (Required):");
        if (reason === null) return;
        if (!reason.trim()) return showToast("Reason is required", "error");

        try {
            await api.put(`/events/${event.id}/revoke-mentor`, { reason });
            showToast("Staff Coordinator revoked successfully", "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to revoke mentor", "error");
        }
    };

    const handleApproveRoster = async () => {
        if (!selectedEvent) return;
        try {
            const res = await api.post(`/events/${selectedEvent.id}/roster/approve`);
            showToast(res.data.message || "Roster approved successfully", "success");
            // Refresh
            handleViewRoster(selectedEvent);
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to approve roster", "error");
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
                                Internal Ops
                            </h1>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                                <MonitorPlay className="w-3 h-3" /> Event Synchronization & Protocol Deployment
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 px-6 py-4">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Temporal mode</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white leading-none whitespace-nowrap">
                                    {showPastEvents ? "ARCHIVE SCAN" : "LIVE PULSE"}
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowPastEvents(!showPastEvents)}
                            className={`px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${showPastEvents
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                                }`}
                        >
                            {showPastEvents ? "Active Stream" : "History Scan"}
                        </button>

                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className={`group flex items-center gap-3 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isCreating
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/10 dark:shadow-none'
                                }`}
                        >
                            {isCreating ? <><X className="w-4 h-4" /> Abort</> : <><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Deploy Event</>}
                        </button>
                    </div>
                </div>

                {/* Creation Form */}
                {isCreating && (
                    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xl">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Operation</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Define session parameters & credentials</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                <div className="md:col-span-2 group">
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-indigo-500 transition-colors">Project Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="E.G., NEURAL SYMPOSIUM 2026"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-black uppercase tracking-wider outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Initiation Time</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-black uppercase tracking-wider outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Termination Time</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-black uppercase tracking-wider outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-3xl space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4">
                                            <Zap className="w-8 h-8 text-indigo-500 opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Calculated Credit</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-[1000] text-white tracking-tighter italic">{Math.floor(formData.allocatedHours)}</span>
                                                <span className="text-xl font-black text-indigo-500 uppercase tracking-widest italic">Hours</span>
                                                <span className="text-3xl font-[1000] text-white tracking-tighter ml-2 italic">{Math.round((formData.allocatedHours % 1) * 60)}</span>
                                                <span className="text-sm font-black text-indigo-500 uppercase tracking-widest italic">Mins</span>
                                            </div>
                                        </div>
                                        <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-transparent w-full opacity-30"></div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                                            TEMPORAL DRIFT DETECTED: AUTO-ALLOCATION ACTIVE. VALUES DERIVED FROM TIME SPAN DELTA.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Max Bandwidth (Participants)</label>
                                        <div className="relative">
                                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="number"
                                                placeholder="UNLIMITED"
                                                value={formData.maxParticipants}
                                                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                                className="w-full bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/50 rounded-2xl pl-16 pr-6 py-5 text-slate-900 dark:text-white font-black uppercase tracking-wider outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-1">
                                    <SearchableSelect
                                        label="Primary Supervisor (Staff)"
                                        placeholder="SEARCH MENTOR ARCHIVE..."
                                        value={formData.staffCoordinatorId}
                                        onChange={(val) => setFormData({ ...formData, staffCoordinatorId: val })}
                                        options={[
                                            { value: "", label: "AUTONOMOUS MODE", sublabel: "NO SUPERVISOR REQUIRED", icon: <Bot className="w-4 h-4" /> },
                                            ...faculties.map(fac => ({
                                                value: String(fac.id),
                                                label: fac.name.toUpperCase(),
                                                sublabel: (fac.department || "CORE OPS").toUpperCase(),
                                                icon: <GraduationCap className="w-4 h-4" />
                                            }))
                                        ]}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <SearchableSelect
                                        label="Protocol Lead (Student)"
                                        placeholder="INPUT CREDENTIALS..."
                                        value={formData.studentCoordinatorId}
                                        isAsync={true}
                                        onSearch={async (q) => {
                                            const res = await api.get(`/admin/search-students?q=${q}`);
                                            return res.data.map(s => ({
                                                value: String(s.id),
                                                label: s.name.toUpperCase(),
                                                sublabel: `${s.rollNo} • ${s.department}`.toUpperCase(),
                                                icon: <User className="w-4 h-4" />
                                            }));
                                        }}
                                        onChange={(val) => setFormData({ ...formData, studentCoordinatorId: val })}
                                    />
                                </div>

                                <div className="md:col-span-2 pt-10 flex justify-end">
                                    <button 
                                        type="submit" 
                                        className="group relative flex items-center gap-4 px-12 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        <span className="relative z-10 group-hover:text-white">Authorize Deployment</span>
                                        <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-all group-hover:text-white" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Registry Section */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap">Active Operations Cluster</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-[400px] bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 animate-pulse" />
                            ))
                        ) : events.length === 0 ? (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    <Mailbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">System Idle</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active protocols detected in this sector</p>
                                </div>
                            </div>
                        ) : (
                            events.map(event => (
                                <div key={event.id} className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:border-indigo-600 dark:hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden flex flex-col">
                                    {/* Glass reflection effect */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white text-[8px] font-[1000] uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20 animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                Operational
                                            </span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{event.eventId}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                            <Terminal className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-8 mb-10">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors italic">
                                            {event.name}
                                        </h3>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Initiation</p>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                                    {new Date(event.startDate).toLocaleDateString()}
                                                    <br />
                                                    <span className="text-indigo-500">{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1.5 text-right">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Termination</p>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                                                    {new Date(event.endDate).toLocaleDateString()}
                                                    <br />
                                                    <span className="text-rose-500">{new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-[1000] text-slate-400 uppercase tracking-widest">Allocated Credit</p>
                                                <p className="text-sm font-black text-indigo-500 italic">
                                                    {Math.floor(event.allocatedHours)}H {Math.round((event.allocatedHours % 1) * 60)}M
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-[1000] text-slate-400 uppercase tracking-widest">Auth Level</p>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${event.staffCoordinatorId ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {event.staffCoordinatorId ? "Supervised" : "Autonomous"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t-2 border-slate-100 dark:border-slate-800/50">
                                            {event.staffCoordinator && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-[10px]">
                                                            {event.staffCoordinator.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mentor</p>
                                                            <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase truncate max-w-[120px]">PROF. {event.staffCoordinator.name}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRevokeMentor(event)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 rounded-xl transition-colors">
                                                        <ShieldAlert className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            {event.studentCoordinator && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-black text-[10px]">
                                                            {event.studentCoordinator.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lead</p>
                                                            <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase truncate max-w-[120px]">{event.studentCoordinator.name}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[8px] font-black text-slate-400">{event.studentCoordinator.rollNo}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => startProjection(event)}
                                            className="col-span-2 py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-indigo-600/20 group/btn relative overflow-hidden flex items-center justify-center gap-3"
                                        >
                                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300"></div>
                                            <MonitorPlay className="w-4 h-4" /> Link Visualizer
                                        </button>
                                        <button
                                            onClick={() => fetchAttendance(event)}
                                            className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-[1000] uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Users className="w-3.5 h-3.5" /> Intel
                                        </button>
                                        <button
                                            onClick={() => handleViewRoster(event)}
                                            className="py-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-[1000] uppercase tracking-widest rounded-2xl hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Roster
                                        </button>
                                        <button
                                            onClick={() => openEditModal(event)}
                                            className="py-4 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-[1000] uppercase tracking-widest rounded-2xl hover:bg-sky-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Pencil className="w-3.5 h-3.5" /> Reconfig
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(event.id)}
                                            className="py-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-[1000] uppercase tracking-widest rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Purge
                                        </button>
                                        <button
                                            onClick={() => { setLogEvent(event); setViewingLogs(true); }}
                                            className="col-span-2 py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800"
                                        >
                                            <ScrollText className="w-3.5 h-3.5" /> Access Audit Trail
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>


            {/* Event Logs Modal */}
            {viewingLogs && logEvent && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[3rem] shadow-2xl border-2 border-slate-900 dark:border-white animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">

                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter">Event Audit Trail</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 italic">{logEvent.name}</p>
                            </div>
                            <button
                                onClick={() => { setViewingLogs(false); setLogEvent(null); }}
                                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12">
                            {!logEvent.timeline || logEvent.timeline.length === 0 ? (
                                <div className="text-center py-20 space-y-6">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                        <ScrollText className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">No operational logs recorded</p>
                                </div>
                            ) : (
                                <div className="space-y-10 relative">
                                    <div className="absolute left-[17px] top-2 bottom-2 w-[2px] bg-indigo-500/20"></div>
                                    {[...logEvent.timeline].reverse().map((log, idx) => (
                                        <div key={idx} className="relative pl-12">
                                            {/* Status Indicator */}
                                            <div className="absolute left-0 top-1 w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center z-10 shadow-lg shadow-indigo-500/10">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    log.action.includes('ASSIGNED') ? 'bg-emerald-500 animate-pulse' : 
                                                    log.action.includes('REVOKED') ? 'bg-rose-500' : 'bg-indigo-500'
                                                }`}></div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                        {log.action.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.time).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                            <User className="w-3 h-3 text-indigo-500" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                            BY {log.performedBy.name} <span className="text-slate-400">({log.performedBy.facultyId})</span>
                                                        </p>
                                                    </div>
                                                    
                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold italic pl-9 relative">
                                                        <div className="absolute left-0 top-0.5 text-indigo-500">“</div>
                                                        {log.details.reason}
                                                    </p>

                                                    {(log.details.newCoordinator || log.details.revokedCoordinator) && (
                                                        <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                            <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                                log.details.newCoordinator ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                                            }`}>
                                                                {log.details.newCoordinator ? 'Assigned' : 'Revoked'}
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                                                {log.details.newCoordinator?.name || log.details.revokedCoordinator?.name}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-6 bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] text-center">Protocol Integrity Verified</p>
                        </div>
                    </div>
                </div>
            )}

            {/* FULLSCREEN PROJECTION OVERLAY */}
            {projectingEvent && (
                <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-hidden">
                    {/* Background Grid/Effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none"></div>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                    {/* Top Protocol Bar */}
                    <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center bg-gradient-to-b from-slate-950 to-transparent z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Radio className="w-6 h-6 text-indigo-500 animate-pulse" />
                            </div>
                            <div>
                                <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                    Broadcast Active
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={stopProjection} 
                            className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-500 rounded-3xl border border-white/10 hover:border-rose-500/30 transition-all font-black uppercase tracking-widest text-[10px] backdrop-blur-xl"
                        >
                            <Zap className="w-4 h-4 group-hover:fill-current" />
                            Terminate Session
                        </button>
                    </div>

                    {/* Center Content */}
                    <div className="relative z-10 text-center max-w-5xl w-full mx-auto flex flex-col items-center space-y-16">
                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-[1000] text-white uppercase tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                {projectingEvent.name}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-slate-500 font-black uppercase tracking-[0.4em] text-xs sm:text-sm">
                                <span className="w-8 h-px bg-slate-800"></span>
                                Attendance & Credit Logging
                                <span className="w-8 h-px bg-slate-800"></span>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 sm:gap-24 w-full">
                            {/* QR Block - Premium Presentation */}
                            <div className="relative group">
                                <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative p-8 sm:p-12 bg-white rounded-[4rem] shadow-[0_0_80px_rgba(255,255,255,0.05)] flex flex-col items-center justify-center border-2 border-indigo-500/10">
                                    {qrData ? (
                                        <img src={qrData} alt="Live QR Code" className="w-[300px] sm:w-[400px] md:w-[450px] aspect-square object-contain rounded-2xl" />
                                    ) : (
                                        <div className="w-[300px] sm:w-[400px] md:w-[450px] aspect-square flex items-center justify-center">
                                            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                    <div className="absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 border-slate-900/10 rounded-tl-xl"></div>
                                    <div className="absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 border-slate-900/10 rounded-tr-xl"></div>
                                    <div className="absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 border-slate-900/10 rounded-bl-xl"></div>
                                    <div className="absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 border-slate-900/10 rounded-br-xl"></div>
                                </div>
                            </div>

                            {/* Verification Block */}
                            {eventOtp && (
                                <div className="flex flex-col items-center space-y-10">
                                    <div className="space-y-4">
                                        <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">Verification Protocol</p>
                                        <div className="flex gap-2 sm:gap-4">
                                            {eventOtp.split('').map((char, index) => (
                                                <div key={index} className="w-16 h-20 sm:w-20 sm:h-24 bg-slate-900 rounded-[1.5rem] border-2 border-slate-800 flex items-center justify-center text-4xl sm:text-6xl font-[1000] text-indigo-500 shadow-2xl shadow-indigo-500/5">
                                                    {char}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-slate-400 bg-white/5 px-8 py-5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                            <ShieldAlert className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Dynamic Session Locking</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Codes rotate every 60 seconds</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                        <div className="flex items-center gap-3 text-slate-600 font-bold uppercase tracking-[0.4em] text-[8px]">
                            <Activity className="w-3 h-3" /> System Operational • Secure Tunnel Established
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT EVENT MODAL */}
            {editingEvent && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border-2 border-slate-900 dark:border-white animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
                        
                        <div className="px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Reconfigure</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 italic">Internal Modification</p>
                            </div>
                            <button
                                onClick={() => setEditingEvent(null)}
                                className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:rotate-90 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Event Designation</label>
                                    <input
                                        required
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all"
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Temporal Start</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={editFormData.startDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Temporal End</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={editFormData.endDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all"
                                    />
                                </div>

                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Allocation</label>
                                        <div className="px-3 py-1 bg-indigo-500 text-white text-[8px] font-black rounded uppercase tracking-widest">Calculated</div>
                                    </div>
                                    <div className="bg-slate-900 rounded-[2rem] p-8 flex items-center gap-12 border-2 border-slate-800">
                                        <div className="flex-1 text-center">
                                            <p className="text-4xl font-[1000] text-white italic">{Math.floor(editFormData.allocatedHours)}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Hours</p>
                                        </div>
                                        <div className="w-px h-12 bg-slate-800"></div>
                                        <div className="flex-1 text-center">
                                            <p className="text-4xl font-[1000] text-indigo-500 italic">{Math.round((editFormData.allocatedHours % 1) * 60)}</p>
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Minutes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Capacity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editFormData.maxParticipants}
                                        onChange={(e) => setEditFormData({ ...editFormData, maxParticipants: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <SearchableSelect
                                        label="Overseer (Staff)"
                                        value={editFormData.staffCoordinatorId}
                                        onChange={(val) => setEditFormData({ ...editFormData, staffCoordinatorId: val })}
                                        options={[
                                            { value: "", label: "No Overseer", sublabel: "Autonomous Mode", icon: <Bot className="w-4 h-4" /> },
                                            ...faculties.map(fac => ({
                                                value: String(fac.id),
                                                label: fac.name,
                                                sublabel: fac.department || "Faculty",
                                                icon: <GraduationCap className="w-4 h-4" />
                                            }))
                                        ]}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <SearchableSelect
                                        label="Liaison (Student)"
                                        value={editFormData.studentCoordinatorId}
                                        isAsync={true}
                                        onSearch={async (q) => {
                                            const res = await api.get(`/admin/search-students?q=${q}`);
                                            return res.data.map(s => ({
                                                value: String(s.id),
                                                label: s.name,
                                                sublabel: `${s.rollNo} • ${s.department}`,
                                                icon: <User className="w-4 h-4" />
                                            }));
                                        }}
                                        onChange={(val) => setEditFormData({ ...editFormData, studentCoordinatorId: val })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    Abort
                                </button>
                                <button type="submit" className="flex-[2] px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl">
                                    Save Config
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeletingId && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl border-2 border-slate-900 dark:border-white animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 text-center">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center mx-auto mb-8 text-rose-500">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic mb-4">Terminate Event?</h2>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider mb-8">
                            This will liquidate all attendance logs and roll back credit hours.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => handleDelete(isDeletingId)} className="w-full py-5 bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-600 transition-all">
                                Confirm Termination
                            </button>
                            <button onClick={() => setIsDeletingId(null)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATTENDANCE MODAL */}
            {attendanceData && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] flex flex-col rounded-[3rem] shadow-2xl border-2 border-slate-950 dark:border-white animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
                        
                        <div className="px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">
                                    {attendanceData.event.name}
                                </h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verified: {attendanceData.attendance.filter(a => a.status === 'APPROVED').length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Provisional: {attendanceData.attendance.filter(a => a.status === 'PROVISIONAL').length}</span>
                                </div>
                            </div>
                            <button onClick={() => setAttendanceData(null)} className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6">
                            {attendanceData.attendance.length === 0 ? (
                                <div className="text-center py-20 space-y-6">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                                        <Mailbox className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center mx-auto max-w-xs leading-relaxed">System waiting for scan incoming protocol...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {attendanceData.attendance.map(record => (
                                        <div key={record.odId} className="group bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border-2 border-transparent hover:border-indigo-500/20 transition-all flex items-center justify-between gap-6">
                                            <div className="min-w-0">
                                                <p className="text-xs font-[1000] text-slate-900 dark:text-white uppercase tracking-tight truncate">{record.student.name}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 italic">{record.student.rollNo}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{record.student.department} • SEM {record.student.semester}</span>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end">
                                                {record.status === 'APPROVED' ? (
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3 h-3" /> Attended
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400">{new Date(record.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ) : record.status === 'PROVISIONAL' ? (
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg flex items-center gap-1.5">
                                                            <MonitorPlay className="w-3 h-3" /> Gate Pass
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">Authorized Hub</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-400 italic uppercase">{record.status}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW ROSTER MODAL */}
            {viewingRoster && (
                <div className="fixed inset-0 z-[100000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border-2 border-slate-950 dark:border-white animate-in zoom-in-95 duration-500 overflow-hidden">
                        
                        <div className="px-10 py-8 border-b-2 border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div>
                                <h2 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter italic">Participant Roster</h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Population: <span className="text-indigo-500">{rosterData.count}</span></span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    {rosterData.isApproved ? (
                                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] italic">Locked & Verified</span>
                                    ) : (
                                        <span className="text-[8px] bg-amber-500/10 text-amber-500 font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] animate-pulse italic">Awaiting Finalization</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {!rosterData.isApproved && selectedEvent?.isRosterSubmitted && (
                                    <button onClick={handleApproveRoster} className="px-6 py-3 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                                        Authorize Roster
                                    </button>
                                )}
                                <button onClick={() => setViewingRoster(false)} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto">
                            {!rosterData.roster || rosterData.roster.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Protocol registry currently empty...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] px-6 pb-2">
                                        <div className="w-12">REF</div>
                                        <div className="flex-1">Identity</div>
                                        <div className="w-24 text-right">Segment</div>
                                    </div>
                                    {rosterData.roster.map((student, idx) => (
                                        <div key={student.rollNo} className="flex items-center px-6 py-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-transparent hover:border-indigo-500/10 transition-all">
                                            <div className="w-12 text-[10px] font-black text-slate-300 italic">{String(idx + 1).padStart(2, '0')}</div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{student.name}</p>
                                                <p className="text-[9px] font-bold text-indigo-500 italic mt-0.5">{student.rollNo}</p>
                                            </div>
                                            <div className="w-24 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                {student.department}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-10 py-6 bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Protocol Verified</p>
                            <button onClick={() => setViewingRoster(false)} className="px-6 py-2 text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
