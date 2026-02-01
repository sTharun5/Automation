import { useNavigate } from "react-router-dom";

export default function Hero({ student, dashboardData }) {
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

        {/* Mentor Info */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 animate-fadeIn">
          <span className="text-lg">👨‍🏫</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider leading-none">Your Mentor</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {dashboardData?.student?.mentor?.name || "No Mentor Assigned"}
            </span>
          </div>
          {dashboardData?.student?.mentor && (
            <div className="ml-2 pl-2 border-l border-blue-200 dark:border-blue-800 flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-medium">{dashboardData.student.mentor.facultyId}</span>
              <span className="text-[9px] text-slate-500 line-clamp-1">{dashboardData.student.mentor.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* 1. Eligibility */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-2xl" aria-hidden>✓</span>
            <span className={`h-1.5 w-8 rounded-full bg-emerald-500`} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">
            Eligibility
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {dashboardData?.placement?.status === "PLACED"
              ? (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Placed</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    @ {dashboardData.placement.companyName}
                  </span>
                  {dashboardData.placement.lpa && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 mt-0.5 border border-slate-200 dark:border-slate-600">
                      Package: {dashboardData.placement.lpa} LPA
                    </span>
                  )}
                </div>
              )
              : "Not Placed"
            }
          </p>
        </div>

        {/* 2. OD Usage */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-2xl" aria-hidden>📅</span>
            <span className={`h-1.5 w-8 rounded-full bg-blue-500`} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">
            OD Usage
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {dashboardData?.odStats?.usedDays || 0} <span className="text-slate-500 dark:text-slate-400 font-normal text-base"> / 60 Days</span>
          </p>
        </div>

        {/* 3. Active OD */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm p-5 md:p-6 transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-2xl" aria-hidden>📋</span>
            <span className={`h-1.5 w-8 rounded-full bg-violet-500`} />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4">
            Active OD
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {dashboardData?.odStats?.activeOD?.type || "None"}
            {dashboardData?.odStats?.activeOD && <span className="text-slate-500 dark:text-slate-400 font-normal text-base"> Approved</span>}
          </p>
        </div>
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
