import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext"; // ✅ Import Hook

export default function Hero({ student, dashboardData }) {
  const navigate = useNavigate();
  const { openChat } = useChat(); // ✅ Use Hook
  const name = student?.name?.split(" ")[0] || "Student";
  const [showApplyModal, setShowApplyModal] = useState(false);

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

      {/* Professional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">

        {/* 1. Placement / Career Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:border-blue-500/30 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Career Status</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Placement Eligibility</h3>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>

          <div className="mt-2">
            {dashboardData?.placement?.status === "NIP" ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 rounded-lg border border-amber-100 dark:border-amber-900/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-sm font-bold">Not Interested in Placements</span>
              </div>
            ) : (dashboardData?.placement?.offers && dashboardData.placement.offers.length > 0) ? (
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dashboardData.placement.totalOffers}</span>
                  <span className="text-sm font-medium text-slate-500">Offers Received</span>
                </div>
                <div className="space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                  {dashboardData.placement.offers.map((offer) => (
                    <div key={offer.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{offer.companyName}</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{offer.lpa} LPA</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg w-fit">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs font-semibold">Not Placed Yet</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Active OD Status (Center Stage) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:border-emerald-500/30 transition-all duration-300 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active OD</h3>
            </div>
            {dashboardData?.odStats?.activeOD && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </div>
            )}
          </div>

          <div className="mt-2 relative z-10">
            {dashboardData?.odStats?.activeOD ? (
              <>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">
                    {dashboardData.odStats.activeOD.type}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${dashboardData.odStats.activeOD.status === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                    : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                    }`}>
                    {dashboardData.odStats.activeOD.status === 'APPROVED' ? 'Active' : 'Pending'}
                  </span>
                </div>

                {(() => {
                  const od = dashboardData.odStats.activeOD;

                  // CASE 1: NOT APPROVED YET (Show Approval Progress)
                  if (od.status !== 'APPROVED') {
                    let progress = 0;
                    let label = "Processing";
                    if (od.status === 'PENDING') { progress = 25; label = "AI Verification"; }
                    else if (od.status === 'DOCS_VERIFIED') { progress = 50; label = "Mentor Review"; }
                    else if (od.status === 'MENTOR_APPROVED') { progress = 75; label = "Final Approval"; }
                    else if (od.status === 'REJECTED') { progress = 100; label = "Rejected"; }

                    return (
                      <div>
                        <div className="flex items-end gap-1.5 mb-2">
                          <span className="text-2xl font-black text-slate-700 dark:text-slate-200 leading-none">
                            {progress}%
                          </span>
                          <span className="text-xs font-bold text-slate-400 mb-0.5">
                            complete
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${od.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          <span>Current Stage: <span className="text-slate-700 dark:text-slate-300 font-bold">{label}</span></span>
                        </div>
                      </div>
                    );
                  }

                  // CASE 2: APPROVED (Show Days Remaining)
                  const start = new Date(od.startDate).getTime();
                  const end = new Date(od.endDate).getTime();
                  const now = new Date().getTime();
                  const total = end - start;
                  const elapsed = now - start;

                  // Calculate Days Left
                  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                  const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

                  return (
                    <div>
                      <div className="flex items-end gap-1.5 mb-2">
                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          {Math.max(0, daysLeft)}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                          days left
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                      </div>

                      <div className="flex justify-between text-[10px] font-medium text-slate-400">
                        <span>Ends: {new Date(od.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full flex flex-col items-center justify-center py-2 text-center h-[90px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group/btn cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-slate-400 group-hover/btn:bg-blue-100 group-hover/btn:text-blue-600 dark:group-hover/btn:bg-blue-900/30 dark:group-hover/btn:text-blue-400 transition-all shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">Start Application</p>
                  <p className="text-[10px] text-slate-400 group-hover/btn:text-slate-500 dark:group-hover/btn:text-slate-500">Click to apply now</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 3. History Stats (Right) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:border-violet-500/30 transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">History</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Total Metrics</h3>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-violet-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>

          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{dashboardData?.odStats?.usedDays || 0}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Total Days Taken</p>
              </div>
              <div className="h-8 w-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="text-right">
                {/* We might need to fetch total count, but days is a good proxy for now, or just show days */}
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Active</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Status</p>
              </div>
            </div>
            <button onClick={() => navigate("/od-history")} className="w-full py-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              View Full History
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => setShowApplyModal(true)}
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

      {/* Apply Mode Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowApplyModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-fadeInUp">

            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choose Application Method</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select how you want to submit your OD request</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                ✕
              </button>
            </div>

            <div className="p-6 grid gap-4">
              {/* Option 1: AI */}
              <div className="group relative p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer"
                onClick={() => { setShowApplyModal(false); openChat(); }}>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">AI Assistant (Recommended)</h4>
                    <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                      Simply tell <b>Disha AI</b> (bottom right) what you need. <br />
                      <span className="opacity-75 italic">"Apply OD for 2 days for Amazon Interview..."</span>
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 animate-pulse">
                  <span className="flex h-3 w-3 rounded-full bg-indigo-500"></span>
                </div>
              </div>

              {/* Option 2: Manual */}
              <button
                onClick={() => { setShowApplyModal(false); navigate("/apply-od"); }}
                className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Manual Form</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fill out the detailed application form manually step-by-step.
                  </p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-400">
                  →
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
