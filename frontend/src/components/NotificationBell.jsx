import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { notifications, unreadCount, markAsRead } = useNotification();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-[10px] font-semibold text-white rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-slideUp">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                <p className="text-[11px] text-slate-400 mt-1">We'll notify you when something happens.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`w-full px-5 py-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 flex flex-col gap-1 ${!n.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full shadow-sm shadow-blue-500/50" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight font-medium">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full py-4 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700/50 transition-colors uppercase tracking-widest"
          >
            View All Activity
          </Link>
        </div>
      )}
    </div>
  );
}
