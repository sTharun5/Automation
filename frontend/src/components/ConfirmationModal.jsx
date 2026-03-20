import { useEffect } from "react";
import {
    AlertTriangle,
    Info
} from "lucide-react";

/**
 * ConfirmationModal component - A generic, reusable modal for confirming user actions.
 * Supports danger states, optional text input (remarks), and customizable button text.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to close the modal (cancel)
 * @param {Function} props.onConfirm - Function to trigger the action (passes remarks if showInput is true)
 * @param {string} props.title - Modal title text
 * @param {string} props.message - Descriptive body text
 * @param {string} [props.confirmText="Confirm"] - Text for the primary action button
 * @param {string} [props.cancelText="Cancel"] - Text for the close button
 * @param {boolean} [props.isDanger=false] - If true, uses red theme for primary action
 * @param {boolean} [props.showInput=false] - If true, displays a remarks textarea
 * @param {string} [props.inputValue=""] - Current value of the remarks textarea
 * @param {Function} [props.onInputChange=() => {}] - Callback for remarks update
 * @param {string} [props.inputPlaceholder=""] - Placeholder for the remarks textarea
 */
export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false,
    showInput = false,
    inputValue = "",
    onInputChange = () => { },
    inputPlaceholder = ""
}) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-transform duration-300 group-hover:scale-110 ${isDanger
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            }`}>
                            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                    </div>
                </div>

                <div className="px-6 py-4 space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {message}
                    </p>
                    {showInput && (
                        <textarea
                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 dark:text-white"
                            placeholder={inputPlaceholder || "Add optional remarks..."}
                            aria-label="Optional remarks"
                            rows="3"
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                        />
                    )}
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        aria-label={cancelText}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-[0.98]"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(inputValue)}
                        aria-label={confirmText}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] ${isDanger
                            ? "bg-red-600 hover:bg-red-500 shadow-red-500/20"
                            : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20"
                            } shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
