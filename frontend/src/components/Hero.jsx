import { useNavigate } from "react-router-dom";

export default function Hero() {
  const student = JSON.parse(localStorage.getItem("user")); // ✅ FIX
  const navigate = useNavigate();

  if (!student) return null;

  return (
    <section className="px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Internship On-Duty
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Smart OD management for placed students
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">


        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Eligibility
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            Placed ✅
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            OD Usage
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            18 / 60 Days
          </p>
        </div>

        

        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Active OD
          </p>
          <p className="text-xl font-semibold mt-2 text-slate-900 dark:text-white">
            Internship (Approved)
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate("/apply-od")}
        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
      >
        Apply Internship OD
      </button>

    </section>

  );
}
