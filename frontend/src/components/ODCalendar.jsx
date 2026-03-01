import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import api from '../api/axios';
import { format, parseISO } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './ODCalendar.css'; // Custom styles for dark mode

export default function ODCalendar({ history = [] }) {
    const [value, onChange] = useState(new Date());
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/calendar');
                setEvents(res.data);
            } catch (err) {
                console.error("Failed to fetch calendar events", err);
            }
        };
        fetchEvents();
    }, []);

    // Helper to find the highest priority OD for a specific date
    const getODForDate = (date) => {
        if (!history || !Array.isArray(history)) return null;

        // precise filtering and priority logic
        const dayODs = history.filter(od => {
            try {
                const start = format(parseISO(od.startDate), 'yyyy-MM-dd');
                const end = format(parseISO(od.endDate), 'yyyy-MM-dd');
                const checkDate = format(date, 'yyyy-MM-dd');
                return checkDate >= start && checkDate <= end;
            } catch (e) {
                console.error(e);
                return false;
            }
        });

        if (dayODs.length === 0) return null;

        // Priority: Approved > Pending > Rejected
        const approved = dayODs.find(od => ["APPROVED", "MENTOR_APPROVED"].includes(od.status));
        if (approved) return approved;

        const pending = dayODs.find(od => ["PENDING", "DOCS_VERIFIED"].includes(od.status));
        if (pending) return pending;

        return dayODs[0]; // Likely Rejected
    };

    // Helper to find overlapping event
    const getEventForDate = (date) => {
        if (!events || !Array.isArray(events)) return null;
        return events.find(e => {
            try {
                // Ignore time, use YYYY-MM-DD for comparison
                const checkDate = format(date, 'yyyy-MM-dd');
                const start = format(parseISO(e.startDate), 'yyyy-MM-dd');
                const end = format(parseISO(e.endDate), 'yyyy-MM-dd');
                return checkDate >= start && checkDate <= end;
            } catch (err) {
                console.error(err);
                return false;
            }
        });
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            // Check for Events First (Priority Display)
            const event = getEventForDate(date);
            if (event) {
                if (event.type === 'EXAM') return 'highlight-purple';
                if (event.type === 'HOLIDAY') return 'highlight-blue';
                return 'highlight-blue'; // Default event
            }

            const od = getODForDate(date);
            if (od) {
                if (od.status === 'APPROVED' || od.status === 'MENTOR_APPROVED') return 'highlight-green';
                if (od.status === 'REJECTED') return 'highlight-red';
                return 'highlight-yellow';
            }
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const event = getEventForDate(date);
            if (event) {
                return (
                    <div className="flex justify-center mt-1 group relative">
                        <div className={`w-2 h-2 rounded-full ${event.type === 'EXAM' ? 'bg-purple-600' : 'bg-blue-500'
                            }`} />
                        {/* Simple Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[150px] bg-slate-800 text-white text-[10px] rounded px-2 py-1 z-50 text-center shadow-lg pointer-events-none">
                            {event.title}
                        </div>
                    </div>
                );
            }

            const od = getODForDate(date);
            if (od) {
                return (
                    <div className="flex justify-center mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${['APPROVED', 'MENTOR_APPROVED'].includes(od.status) ? 'bg-emerald-500' :
                            od.status === 'REJECTED' ? 'bg-red-500' :
                                'bg-amber-500'
                            }`} />
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-6 uppercase tracking-wider">
                OD Calendar
            </h3>
            <div className="calendar-container">
                <Calendar
                    onChange={onChange}
                    value={value}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    className="w-full border-none bg-transparent text-slate-700 dark:text-slate-300"
                />
            </div>

            <div className="mt-4 flex gap-4 justify-center text-xs text-slate-500">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Approved
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-600" /> Exam
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Holiday
                </div>
            </div>
        </div>
    );
}
