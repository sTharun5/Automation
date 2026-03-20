/**
 * DateInput component - A simplified, styled date picker input field.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - The label text for the input
 * @param {Function} props.onChange - Callback function for value changes
 */
export default function DateInput({ label, onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-slate-900 dark:text-white">{label}</label>
      <input
        type="date"
        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
