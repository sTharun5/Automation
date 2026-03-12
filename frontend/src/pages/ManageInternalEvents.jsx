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
    Bot
} from 'lucide-react';

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
            <Header title="Manage Internal Events" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-indigo-600 mb-2 flex items-center gap-1 transition-colors text-sm font-bold uppercase tracking-wider">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Internal Events</h1>
                        <p className="text-slate-600 dark:text-slate-400 font-medium italic">Create and manage internal pre-registered OD sessions.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Toggle Past Events */}
                        <button
                            onClick={() => setShowPastEvents(!showPastEvents)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${showPastEvents
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-500'
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            <span>{showPastEvents ? "Showing All" : "Active Only"}</span>
                        </button>

                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-[0.98] ${isCreating
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-none'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                }`}
                        >
                            {isCreating ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create Event</>}
                        </button>
                    </div>
                </div>

                {/* Creation Form */}
                {isCreating && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm animate-slideDown">
                        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-6">Event Details</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g., Tech Symposium 2026"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">OD Value (Allocated Credit)</label>
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex-1">
                                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1 text-center">Hours</label>
                                        <input
                                            readOnly
                                            type="number"
                                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                            value={Math.floor(formData.allocatedHours)}
                                        />
                                    </div>
                                    <div className="text-slate-300 dark:text-slate-600 font-bold">:</div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1 text-center">Minutes</label>
                                        <input
                                            readOnly
                                            type="number"
                                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                            value={Math.round((formData.allocatedHours % 1) * 60)}
                                        />
                                    </div>
                                    <div className="flex-[2] bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-0.5">Total Credit</p>
                                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{Math.floor(formData.allocatedHours)}h {Math.round((formData.allocatedHours % 1) * 60)}m</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 px-1">Note: Minimum credit is 1 hour. Values are auto-calculated but can be overridden manually.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Capacity (Max Students)</label>
                                <input
                                    type="number"
                                    placeholder="0 for unlimited"
                                    value={formData.maxParticipants}
                                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <SearchableSelect
                                    label="Staff Coordinator"
                                    placeholder="Select a mentor..."
                                    value={formData.staffCoordinatorId}
                                    onChange={(val) => setFormData({ ...formData, staffCoordinatorId: val })}
                                    options={[
                                        { value: "", label: "Auto-Approval", sublabel: "No staff coordinator assigned", icon: <Bot className="w-4 h-4" /> },
                                        ...faculties.map(fac => ({
                                            value: String(fac.id),
                                            label: fac.name,
                                            sublabel: fac.department || "Faculty",
                                            icon: <GraduationCap className="w-4 h-4" />
                                        }))
                                    ]}
                                />
                            </div>
                            <div>
                                <SearchableSelect
                                    label="Student Coordinator"
                                    placeholder="Type roll no or name..."
                                    value={formData.studentCoordinatorId}
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
                                    onChange={(val) => setFormData({ ...formData, studentCoordinatorId: val })}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-4">
                                <button type="submit" className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold uppercase tracking-wider rounded-xl hover:scale-[1.02] transition-transform">
                                    Finalize Event
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Events List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Events...</div>
                    ) : events.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <Mailbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">No active events</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Active</span>
                                    <span className="text-xs font-bold text-slate-400">{event.eventId}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 leading-tight">{event.name}</h3>
                                <div className="space-y-1 mb-6 flex-1">
                                    <p className="text-xs text-slate-500 font-medium">Starts: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(event.startDate).toLocaleString()}</span></p>
                                    <p className="text-xs text-slate-500 font-medium">Ends: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(event.endDate).toLocaleString()}</span></p>
                                    <p className="text-xs text-slate-500 font-medium">Value: <span className="font-bold text-indigo-500">{Math.floor(event.allocatedHours)}h {Math.round((event.allocatedHours % 1) * 60)}m</span></p>

                                    <div className="space-y-3 mt-4">
                                        {event.staffCoordinatorId && (
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mentor (Staff)</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        Prof. {event.staffCoordinator?.name}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeMentor(event)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors group"
                                                    title="Revoke Mentor Access"
                                                >
                                                    <span className="text-xs font-black uppercase tracking-tighter group-hover:underline">Revoke</span>
                                                </button>
                                            </div>
                                        )}

                                        {event.studentCoordinatorId && (
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead (Student)</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {event.studentCoordinator?.name} <span className="text-[10px] font-medium text-slate-500">({event.studentCoordinator?.rollNo})</span>
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm("Revoke student coordinator access?")) {
                                                            try {
                                                                await api.put(`/events/internal/${event.id}`, { studentCoordinatorId: "" });
                                                                showToast("Student coordinator revoked", "success");
                                                                fetchEvents();
                                                            } catch (err) {
                                                                showToast("Failed to revoke student coordinator", "error");
                                                            }
                                                        }
                                                    }}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors group"
                                                    title="Revoke Student Access"
                                                >
                                                    <span className="text-xs font-black uppercase tracking-tighter group-hover:underline">Revoke</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {event.staffCoordinatorId ? (
                                        <p className="text-xs text-slate-500 font-medium">Roster Status:
                                            {event.isRosterApproved ? (
                                                <span className="font-bold text-green-500 ml-1">Approved</span>
                                            ) : event.isRosterSubmitted ? (
                                                <span className="font-bold text-amber-500 ml-1">Pending Approval</span>
                                            ) : (
                                                <span className="font-bold text-slate-400 ml-1">Not Submitted</span>
                                            )}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No staff coordinator assigned.</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={() => startProjection(event)}
                                        className="col-span-2 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <MonitorPlay className="w-5 h-5" /> Project Live QR
                                    </button>
                                    <button
                                        onClick={() => fetchAttendance(event)}
                                        disabled={isFetchingAttendance}
                                        className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                                        title="Attendance Log"
                                    >
                                        <Users className="w-3.5 h-3.5" /> Attendance
                                    </button>
                                    <button
                                        onClick={() => handleViewRoster(event)}
                                        className="py-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 dark:hover:text-white transition-colors flex items-center justify-center gap-1"
                                        title="View Pre-Registered Roster"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Roster
                                    </button>
                                    <button
                                        onClick={() => openEditModal(event)}
                                        className="py-2.5 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                                        title="Edit Event"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(event.id)}
                                        className="py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
                                        title="Delete Event"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                    <button
                                        onClick={() => { setLogEvent(event); setViewingLogs(true); }}
                                        className="col-span-2 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-800"
                                        title="View Administrative Logs"
                                    >
                                        <ScrollText className="w-3.5 h-3.5" /> Event Logs
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Event Logs Modal */}
            {
                viewingLogs && logEvent && (
                    <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-slideUp overflow-hidden">

                            {/* Header */}
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Event Audit Logs</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">{logEvent.name}</p>
                                </div>
                                <button
                                    onClick={() => { setViewingLogs(false); setLogEvent(null); }}
                                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8">
                                {!logEvent.timeline || logEvent.timeline.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ScrollText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No administrative logs recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {[...logEvent.timeline].reverse().map((log, idx) => (
                                            <div key={idx} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 pb-2 last:pb-0">
                                                {/* Dot */}
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-sm z-10" />

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${log.action === 'COORDINATOR_ASSIGNED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            log.action === 'COORDINATOR_REVOKED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                                'bg-slate-100 text-slate-700 dark:bg-slate-800'
                                                            }`}>
                                                            {log.action.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {new Date(log.time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                                                        By {log.performedBy.name} ({log.performedBy.facultyId})
                                                    </p>

                                                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                            <span className="font-bold text-slate-900 dark:text-white uppercase text-[9px] mr-1">Reason:</span>
                                                            {log.details.reason}
                                                        </p>
                                                        {log.details.newCoordinator && (
                                                            <p className="text-[10px] text-indigo-500 font-bold mt-1">
                                                                New: {log.details.newCoordinator.name} ({log.details.newCoordinator.rollNo})
                                                            </p>
                                                        )}
                                                        {log.details.revokedCoordinator && (
                                                            <p className="text-[10px] text-rose-500 font-bold mt-1">
                                                                Revoked: {log.details.revokedCoordinator.name} ({log.details.revokedCoordinator.rollNo})
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End of Audit Trail</p>
                            </div>

                        </div>
                    </div>
                )
            }

            {/* FULLSCREEN PROJECTION OVERLAY */}
            {
                projectingEvent && (
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
                )
            }

            {/* EDIT EVENT MODAL */}
            {
                editingEvent && (
                    <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-slideUp overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Edit Internal Event</h2>
                                <button onClick={() => setEditingEvent(null)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={editFormData.startDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={editFormData.endDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">OD Value (Allocated Credit)</label>
                                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1 text-center">Hours</label>
                                            <input
                                                readOnly
                                                type="number"
                                                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                                value={Math.floor(editFormData.allocatedHours)}
                                            />
                                        </div>
                                        <div className="text-slate-300 dark:text-slate-600 font-bold">:</div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1 ml-1 text-center">Minutes</label>
                                            <input
                                                readOnly
                                                type="number"
                                                className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-bold cursor-not-allowed"
                                                value={Math.round((editFormData.allocatedHours % 1) * 60)}
                                            />
                                        </div>
                                        <div className="flex-[2] bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-2 text-center">
                                            <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-0.5">Total Credit</p>
                                            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{Math.floor(editFormData.allocatedHours)}h {Math.round((editFormData.allocatedHours % 1) * 60)}m</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 px-1">Note: Minimum credit is 1 hour. Values are auto-calculated but can be overridden manually.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Capacity (Max Students)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editFormData.maxParticipants}
                                        onChange={(e) => setEditFormData({ ...editFormData, maxParticipants: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Staff Coordinator"
                                        placeholder="Select a mentor..."
                                        value={editFormData.staffCoordinatorId}
                                        onChange={(val) => setEditFormData({ ...editFormData, staffCoordinatorId: val })}
                                        options={[
                                            { value: "", label: "Auto-Approval", sublabel: "No staff coordinator assigned", icon: <Bot className="w-4 h-4" /> },
                                            ...faculties.map(fac => ({
                                                value: String(fac.id),
                                                label: fac.name,
                                                sublabel: fac.department || "Faculty",
                                                icon: <GraduationCap className="w-4 h-4" />
                                            }))
                                        ]}
                                    />
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Student Coordinator"
                                        placeholder="Type roll no or name..."
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
                                <div className="md:col-span-2 flex justify-end mt-4 gap-4">
                                    <button type="button" onClick={() => setEditingEvent(null)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider rounded-xl transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* DELETE CONFIRMATION MODAL */}
            {
                isDeletingId && (
                    <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all animate-slideUp">

                            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6 text-red-600 dark:text-red-500">
                                <AlertCircle className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Revoke & Delete Event</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
                                Deleting this event will instantly <span className="text-red-500 font-bold">cancel all ODs</span> generated through this QR code and <span className="text-indigo-500 font-bold">refund the hours</span> back to the students' balances. This action is irreversible.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeletingId(null)}
                                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    className="flex-1 py-3.5 bg-red-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                                >
                                    Confirm Delete
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }

            {/* DELETE ALL CONFIRMATION MODAL */}
            {
                isDeletingAll && (
                    <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-rose-200 dark:border-rose-900/50 transform transition-all animate-slideUp">

                            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-6 text-rose-600 dark:text-rose-500">
                                <ShieldAlert className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Nuke All Events</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 font-medium">
                                You are about to delete <span className="text-rose-500 font-bold">ALL {events.length} active events</span>. This will immediately cancel all associated student ODs and refund their unspent hours. This absolute wipe cannot be undone.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setIsDeletingAll(false)}
                                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDeleteAll}
                                    className="flex-1 py-3.5 bg-rose-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30"
                                >
                                    Nuke Everything
                                </button>
                            </div>

                        </div>
                    </div>
                )
            }

            {/* ATTENDANCE MODAL */}
            {
                attendanceData && (
                    <div className="fixed inset-0 z-[100000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-slideUp overflow-hidden">

                            {/* Header */}
                            <div className="px-6 md:px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        {attendanceData.event.name}
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        <span className="font-bold text-green-600 dark:text-green-400">{attendanceData.attendance.filter(a => a.status === 'APPROVED').length}</span> attended • <span className="font-bold text-amber-600 dark:text-amber-400">{attendanceData.attendance.filter(a => a.status === 'PROVISIONAL').length}</span> gate pass verified
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAttendanceData(null)}
                                    className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-slate-900/50">
                                {attendanceData.attendance.length === 0 ? (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                                        <Mailbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">No scans recorded yet</p>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Students need to scan the live projection to appear here.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {attendanceData.attendance.map(record => (
                                            <div key={record.odId} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white capitalize">{record.student.name.toLowerCase()}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">
                                                            {record.student.rollNo}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase text-slate-500">
                                                            {record.student.department} • Semester {record.student.semester}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col justify-center items-end shrink-0">
                                                    {record.status === 'APPROVED' ? (
                                                        <>
                                                            <span className="text-[10px] font-black uppercase text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg border border-green-100 dark:border-green-500/20 mb-1 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" /> Attended
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                {new Date(record.scanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </>
                                                    ) : record.status === 'PROVISIONAL' ? (
                                                        <>
                                                            <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20 mb-1 flex items-center gap-1">
                                                                <MonitorPlay className="w-3 h-3" /> Gate Pass
                                                            </span>
                                                            {(() => {
                                                                const verifierEntries = record.timeline?.filter(t => t.label === "Gate Pass Authorized") || [];
                                                                return verifierEntries.length > 0 ? (
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        {verifierEntries.map((entry, idx) => (
                                                                            <div key={idx} className="flex flex-col items-end leading-none border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                                                                                <span className="text-[9px] text-slate-400 font-bold">By {entry.description?.split("Prof. ")[1]?.split(" (")[0] || "Staff"}</span>
                                                                                <span className="text-[8px] text-slate-400 font-medium">{new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 font-bold">Authorized</span>
                                                                );
                                                            })()}
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 italic">{record.status}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )
            }

            {/* View Roster Modal */}
            {
                viewingRoster && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        📋 Participant Roster
                                        {!rosterData.isApproved && !selectedEvent?.isRosterSubmitted && (
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-1 rounded uppercase tracking-widest">
                                                Not Submitted Yet
                                            </span>
                                        )}
                                        {!rosterData.isApproved && selectedEvent?.isRosterSubmitted && (
                                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">
                                                Pending Approval
                                            </span>
                                        )}
                                        {rosterData.isApproved && (
                                            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold px-2 py-1 rounded uppercase tracking-widest">
                                                Approved & Locked
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                                        Total Participants: <span className="font-bold text-slate-900 dark:text-white">{rosterData.count}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!rosterData.isApproved && (
                                        <button
                                            onClick={handleApproveRoster}
                                            disabled={!selectedEvent?.isRosterSubmitted}
                                            className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedEvent?.isRosterSubmitted
                                                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 dark:shadow-none"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                                }`}
                                        >
                                            {selectedEvent?.isRosterSubmitted ? <><CheckCircle2 className="w-4 h-4" /> Approve Roster</> : <><Clock className="w-4 h-4" /> Awaiting Submission</>}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setViewingRoster(false)}
                                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {!rosterData.isApproved && !selectedEvent?.isRosterSubmitted && (
                                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center gap-3">
                                    <Info className="w-5 h-5 text-indigo-500" />
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                        The roster has not been submitted by the <span className="font-bold">Student Coordinator</span> yet. You can approve it once they finalize the list.
                                    </p>
                                </div>
                            )}

                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {rosterLoading ? (
                                    <div className="py-12 text-center animate-pulse text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        Loading Roster Data...
                                    </div>
                                ) : !rosterData.roster || rosterData.roster.length === 0 ? (
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
        </div>
    );
}
