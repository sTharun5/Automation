import { useEffect } from "react";

/**
 * ConfirmLogoutModal component - A security-focused modal to confirm user sign-out.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is visible
 * @param {Function} props.onClose - Function to close the modal (cancel)
 * @param {Function} props.onConfirm - Function to trigger the sign-out process
 * @param {boolean} props.loading - Loading state during sign-out
 */
export default function ConfirmLogoutModal({ open, onClose, onConfirm, loading }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-lg">
              {loading ? <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : "🚪"}
            </span>
            <h2 id="logout-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              {loading ? "Signing out..." : "Sign out"}
            </h2>
          </div>
        </div>

        <p className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {loading ? "Please wait while we secure your session..." : "Are you sure you want to sign out from SMART OD Portal?"}
        </p>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
