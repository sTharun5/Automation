export default function FileUpload({ onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1 text-slate-900 dark:text-white">Proof File Name</label>
      <input
        type="text"
        placeholder="7376222AD218-ITI-24.12.2025.pdf"
        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
