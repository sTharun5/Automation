import { Loader2 } from "lucide-react";

/**
 * LoadingButton - A reusable button that shows a spinner while an async action is in progress.
 * Automatically disables itself during loading to prevent double-submit.
 *
 * @param {boolean}  isLoading   - Shows spinner and disables the button when true
 * @param {string}   [loadingText] - Optional text to show while loading (defaults to original children)
 * @param {boolean}  [disabled]  - Additional disabled condition (combined with isLoading)
 * @param {string}   [type]      - Button type (default: "button")
 * @param {string}   className   - Full className for styling (passed through as-is)
 * @param {Function} onClick     - Click handler
 * @param {ReactNode} children   - Button label content
 */
export default function LoadingButton({
  isLoading = false,
  loadingText,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  children,
  ...rest
}) {
  const isDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      className={`${className} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""} inline-flex items-center justify-center gap-2 transition-all`}
      {...rest}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
