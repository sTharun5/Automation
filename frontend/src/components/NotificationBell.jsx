import { useState, useEffect, useRef } from "react";

const notifications = [
  { id: 1, text: "Your OD request has been approved", time: "2h ago", read: false },
  { id: 2, text: "Internship OD expires in 5 days", time: "1d ago", read: false },
  { id: 3, text: "New OD rules updated", time: "3d ago", read: true },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <span className="text-xl" aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-[10px] font-semibold text-white rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden animate-fadeIn z-50">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <span className="text-3xl text-slate-300 dark:text-slate-600 block mb-2" aria-hidden>🔔</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No new notifications
              </p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-l-2 ${
                      n.read
                        ? "border-transparent text-slate-600 dark:text-slate-400"
                        : "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 text-slate-900 dark:text-white"
                    }`}
                  >
                    <p className="font-medium">{n.text}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.time}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
