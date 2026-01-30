import { useNavigate } from "react-router-dom";

export default function Hero() {
  const student = JSON.parse(localStorage.getItem("student"));
  const navigate = useNavigate();

  // Mock values (later from API)
  const isPlaced = true;
  const usedDays = 18;
  const maxDays = 60;
  const activeOD = "Internship (Approved)";

  return (
    <section className="px-8 py-10">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Internship On-Duty
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Smart OD management for placed students
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Eligibility */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Eligibility
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            {isPlaced ? "Placed ✅" : "Not Eligible ❌"}
          </p>
        </div>

        {/* OD Usage */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            OD Usage
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            {usedDays} / {maxDays} Days
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-3">
            <div
              className="h-2 bg-blue-600 rounded-full"
              style={{ width: `${(usedDays / maxDays) * 100}%` }}
            />
          </div>
        </div>

        {/* Active OD */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active OD
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            {activeOD || "None"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => navigate("/apply-od")}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
        >
          Apply Internship OD
        </button>

        <button
          onClick={() => navigate("/od-history")}
          className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
        >
          View OD History
        </button>
      </div>

      {/* Footer note */}
      <p className="text-xs text-slate-400 mt-6">
        Last updated: {new Date().toLocaleString()}
      </p>
    </section>
  );
}
