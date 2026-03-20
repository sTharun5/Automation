/**
 * FileUpload component - Input field for specifying the filename of uploaded proof documents.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onChange - Callback function for filename changes
 */
export default function FileUpload({ onChange }) {
  const inputId = "proof-file-input";
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm mb-1 text-slate-900 dark:text-white">Proof File Name</label>
      <input
        id={inputId}
        type="text"
        placeholder="7376222AD218-ITI-24.12.2025.pdf"
        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
