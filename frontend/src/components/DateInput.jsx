export default function DateInput({ label, onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type="date"
        className="w-full border p-2 rounded"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
