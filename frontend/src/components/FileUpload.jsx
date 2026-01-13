export default function FileUpload({ onChange }) {
  return (
    <div>
      <label className="block text-sm mb-1">Proof File Name</label>
      <input
        type="text"
        placeholder="7376222AD218-ITI-24.12.2025.pdf"
        className="w-full border p-2 rounded"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
