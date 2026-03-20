import { useState, useEffect } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

/**
 * CalendarManagementModal component - Admin interface for managing global calendar events (Exams, Holidays, etc.).
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to close the modal
 */
export default function CalendarManagementModal({ isOpen, onClose }) {
    const { showToast } = useToast();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: "",
        startDate: "",
        endDate: "",
        type: "EXAM" // EXAM, HOLIDAY, EVENT
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get("/calendar");
            setEvents(res.data);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch events", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) {
            showToast("Please fill all fields", "error");
            return;
        }

        try {
            await api.post("/calendar", newEvent);
            showToast("Event added successfully", "success");
            setNewEvent({ title: "", startDate: "", endDate: "", type: "EXAM" }); // Reset
            fetchEvents();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add event", "error");
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.delete(`/calendar/${id}`);
            showToast("Event deleted successfully", "success");
            fetchEvents();
        } catch (err) {
            console.error(err);
            showToast("Failed to delete event", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">📅 Manage Calendar Events</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Add Event Form */}
                    <form onSubmit={handleAddEvent} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Add New Event</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Event Title (e.g. Sem End Exams)"
                                className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                            />
                            <select
                                className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                            >
                                <option value="EXAM">🔴 Exam (Blocks ODs)</option>
                                <option value="HOLIDAY">🔵 Holiday</option>
                                <option value="EVENT">🟢 Event</option>
                            </select>
                            <input
                                type="date"
                                className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                value={newEvent.startDate}
                                onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white text-sm"
                                value={newEvent.endDate}
                                onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                            Add Event
                        </button>
                    </form>

                    {/* Event List */}
                    <div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Existing Events</h3>
                        {loading ? <p className="text-center text-slate-500">Loading...</p> : (
                            <div className="space-y-3">
                                {events.length === 0 ? <p className="text-slate-500 italic text-center">No events found.</p> : events.map(event => (
                                    <div key={event.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${event.type === 'EXAM' ? 'bg-red-500' :
                                                event.type === 'HOLIDAY' ? 'bg-blue-500' : 'bg-green-500'
                                                }`} />
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{event.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 uppercase tracking-wide">
                                                        {event.type}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete Event"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
