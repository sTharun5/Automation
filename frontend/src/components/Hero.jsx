import { useNavigate } from "react-router-dom";

const statCards = [
  { label: "Eligibility", value: "Placed", sub: "✅", icon: "✓", accent: "bg-emerald-500" },
  { label: "OD Usage", value: "18 / 60", sub: "Days", icon: "📅", accent: "bg-blue-500" },
  { label: "Active OD", value: "Internship", sub: "Approved", icon: "📋", accent: "bg-violet-500" },
];

export default function Hero({ student }) {
  const navigate = useNavigate();
  const name = student?.name?.split(" ")[0] || "Student";

  if (!student) return null;

  return (
    <section className="animate-fadeIn">
      <div className="mb-8">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">
          Welcome back
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">
          Hello, {name}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
          Manage your Internship On-Duty applications and track status from one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="
              rounded-2xl bg-white dark:bg-slate-800/80
              border border-slate-200 dark:border-slate-700/80
              shadow-sm p-5 md:p-6
              transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600
            "
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden>{card.icon}</span>
              <span className={`h-1.5 w-8 rounded-full ${card.accent}`} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">
              {card.label}
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {card.value} {card.sub && <span className="text-slate-500 dark:text-slate-400 font-normal text-base"> {card.sub}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate("/apply-od")}
        className="
          px-6 py-3.5 rounded-xl font-semibold text-white
          bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-700 hover:to-indigo-700
          shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30
          transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]
        "
      >
        Apply Internship OD →
      </button>
    </section>
  );
}
