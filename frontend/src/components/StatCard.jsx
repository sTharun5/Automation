export default function StatCard({ title, value, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} p-5 rounded-xl shadow-lg text-white hover:-translate-y-1 transition`}>
      <p className="text-sm opacity-90">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}
