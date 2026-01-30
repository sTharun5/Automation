export default function ConfirmLogoutModal({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-[360px] animate-fadeIn">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Sign out
          </h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to sign out from SMART OD Portal?
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
