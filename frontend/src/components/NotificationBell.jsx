import { useState } from "react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);

  // Dummy notifications (later connect backend)
  const notifications = [
    "Your OD request has been approved",
    "Internship OD expires in 5 days",
    "New OD rules updated"
  ];

  return (
    <div className="relative">
      {/* Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-xl text-white hover:scale-110 transition"
        aria-label="Notifications"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-xs rounded-full flex items-center justify-center text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-slate-800 rounded-xl shadow-xl border border-white/10 overflow-hidden animate-fadeIn z-50">

          <div className="px-4 py-3 border-b border-slate-700 text-sm font-semibold text-white">
            Notifications
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">
              No new notifications
            </p>
          ) : (
            notifications.map((n, i) => (
              <div
                key={i}
                className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              >
                {n}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
