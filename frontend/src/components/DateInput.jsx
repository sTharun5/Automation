/**
 * DateInput component - A simplified, styled date picker input field.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - The label text for the input
 * @param {Function} props.onChange - Callback function for value changes
 */
export default function DateInput({ label, onChange }) {
  const inputId = `date-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm mb-1 text-slate-900 dark:text-white">{label}</label>
      <input
        id={inputId}
        type="date"
        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
