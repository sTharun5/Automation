import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { BASE_URL } from "../api/axios";
import InternshipReportModal from "../components/InternshipReportModal";
import Header from "../components/Header";
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  Activity,
  Clock,
  CheckCircle2,
  History,
  FileCheck2,
  Building2,
  Calendar,
  Download,
  XCircle,
  Timer,
  Check,
  Zap,
  LayoutGrid,
  ShieldCheck,
  FileSearch,
  ArrowUpRight
} from "lucide-react";

export default function StudentODDetails() {
  const { odId } = useParams();
  const navigate = useNavigate();
  const [od, setOd] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchOD = () => {
    api.get(`/od/details/${odId}`)
      .then((res) => setOd(res.data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchOD();
    const interval = setInterval(fetchOD, 10000); // Poll every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odId]);

  const [, setTick] = useState(0);

  // Live Ticker
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  /* =========================================
     ⏱️ HELPERS
  ========================================= */
  /* =========================================
     ⏱️ HELPERS
  ========================================= */
  const calculateProgress = (startDate, endDate, status) => {
    if (!status) return 0;

    // CASE 1: NOT APPROVED (Show Approval Progress)
    // Treat MENTOR_APPROVED as FINAL APPROVED
    if (status !== "APPROVED" && status !== "MENTOR_APPROVED") {
      if (status === "REJECTED") return 100; // Full bar but red
      if (status === "DOCS_VERIFIED") return 50;
      if (status === "PENDING") return 25;
      return 0;
    }

    // CASE 2: APPROVED (Show Timeline Progress)
    const start = new Date(startDate);
    start.setHours(8, 45, 0, 0);
    const end = new Date(endDate);
    end.setHours(16, 20, 0, 0);
    const now = new Date().getTime();

    if (now < start.getTime()) return 0;
    if (now > end.getTime()) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now - start.getTime();
    if (total <= 0) return 100;

    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getProgressLabel = (status) => {
    if (status === "APPROVED" || status === "MENTOR_APPROVED") return "OD Timeline";
    if (status === "DOCS_VERIFIED") return "Mentor Review";
    if (status === "PENDING") return "AI Verification";
    if (status === "REJECTED") return "Rejected";
    return "Processing";
  }

  const getElapsedDays = (startDate, endDate, status, duration) => {
    if (status !== "APPROVED" && status !== "MENTOR_APPROVED") return "0";

    const start = new Date(startDate);
    start.setHours(8, 45, 0, 0);
    const end = new Date(endDate);
    end.setHours(16, 20, 0, 0);
    const now = new Date();

    if (now < start) return "0.0";
    if (now > end) return duration.toString();

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    if (totalMs <= 0) return duration.toString();

    const fractional = duration * (elapsedMs / totalMs);
    return fractional.toFixed(1);
  };

  const getLiveStatus = (startDate, endDate, status) => {
    if (status === "REJECTED") return { label: "Rejected", color: "text-red-500 bg-red-50 border-red-100" };
    if (status === "PENDING" || status === "DOCS_VERIFIED") return { label: "Approval Pending", color: "text-blue-600 bg-blue-50 border-blue-100" };

    // Approved Logic (Include MENTOR_APPROVED)
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(8, 45, 0, 0);
    const end = new Date(endDate);
    end.setHours(16, 20, 0, 0);

    if (now < start) return { label: "Scheduled", color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (now > end) return { label: "Completed", color: "text-slate-600 bg-slate-100 border-slate-200" };
    return { label: "Active Now", color: "text-emerald-600 bg-emerald-50 border-emerald-100 animate-pulse" };
  };

  if (!od) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isApproved = od.status === "APPROVED" || od.status === "MENTOR_APPROVED";
  const isCompleted = isApproved && new Date(od.endDate).setHours(16, 20, 0, 0) < new Date().getTime();

  const statusText = od.status === "PENDING" ? "Initiated" : (isCompleted ? "COMPLETED" : od.status);
  const progressPercent = calculateProgress(od.startDate, od.endDate, od.status);

  // Logic for report requirement prompt
  const needsReport = od.type !== 'INTERNAL' && isCompleted && (!od.report || od.report.status !== "APPROVED");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Application Dossier</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Real-time Transmission Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border shadow-sm ${getLiveStatus(od.startDate, od.endDate, od.status).color}`}>
                {getLiveStatus(od.startDate, od.endDate, od.status).label}
              </span>
          </div>
        </div>

        {needsReport && (
          <div className="mb-10 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/30 rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-200/20 dark:shadow-none overflow-hidden relative group">
            <div className="absolute inset-0 bg-amber-500/5 pointer-events-none"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 rotate-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Report Required</h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                  {od.report?.status === "PENDING"
                    ? "Vector Transmission: Review in Progress"
                    : "Post-Activity Documentation Mandatory"}
                </p>
              </div>
            </div>
            {(!od.report || od.report.status !== "PENDING") && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] py-4 px-10 rounded-2xl hover:bg-amber-500 dark:hover:bg-amber-500 dark:hover:text-white transition-all shadow-xl shadow-slate-200/50 dark:shadow-none relative z-10"
              >
                Submit Dossier
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status & Progress Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
               
               <div className="flex justify-between items-start mb-8 relative z-10">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Primary Vector</p>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-2">
                       {od.type === 'INTERNAL' ? (od.event?.name || "Internal Activity") : (od.offer?.company?.name || od.verificationDetails?.company?.searched || "Unknown Node")}
                    </h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Status Code</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{statusText}</p>
                 </div>
               </div>

               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        {progressPercent}% {isApproved ? "Mission Coverage" : "Synchronization"}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       {isApproved ? `${getElapsedDays(od.startDate, od.endDate, od.status, od.duration)} / ${od.duration} Cycles` : getProgressLabel(od.status)}
                    </p>
                  </div>

                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${od.status === 'REJECTED' ? 'bg-rose-500' :
                        isApproved ? 'bg-indigo-600 shadow-lg shadow-indigo-500/40' :
                        'bg-slate-900 dark:bg-white'
                        }`}
                      style={{ width: `${progressPercent}%` }}
                    >
                      {!isApproved && od.status !== 'REJECTED' && (
                        <div className="absolute inset-0 bg-white/20 animate-shimmer scale-x-150"></div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            {/* Application Lifecycle */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex items-center gap-4 mb-12">
                   <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <History className="w-5 h-5" />
                   </div>
                   <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Transmission History</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Activity Lifecycle Pipeline</p>
                   </div>
                </div>

                <div className="space-y-12 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                  {(od.timeline || []).map((step, idx) => (
                    <div key={idx} className="relative pl-14 group/step">
                      <div className={`absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl transition-all ${step.status === "REJECTED" ? "bg-rose-500 text-white" :
                        idx === (od.timeline.length - 1) && !isApproved ? "bg-indigo-600 text-white animate-pulse" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/step:bg-indigo-500 group-hover/step:text-white"
                        }`}>
                        {step.status === "REJECTED" ? <XCircle className="w-5 h-5" /> : (idx === (od.timeline.length - 1) && !isApproved ? <Timer className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                           <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{step.label}</h5>
                           <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">{new Date(step.time).toLocaleString()}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-8">
             {/* IDs Card */}
             <div className="bg-slate-900 dark:bg-white p-8 rounded-[2.5rem] text-white dark:text-slate-900 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 dark:bg-black/5 rounded-full -ml-16 -mt-16 blur-2xl"></div>
                
                <div className="space-y-8 relative z-10">
                   <div>
                      <p className="text-[9px] font-black text-indigo-300 dark:text-indigo-400 uppercase tracking-widest mb-2">Universal Tracker</p>
                      <p className="text-3xl font-black tracking-tighter uppercase">{od.trackerId}</p>
                   </div>
                   <div className="pt-8 border-t border-white/10 dark:border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Activity Reference</p>
                      <p className="text-xl font-black tracking-tighter text-indigo-400 dark:text-indigo-600 font-mono">{od.activityId || "PENDING_INT"}</p>
                   </div>
                </div>
             </div>

             {/* Details Matrix */}
             <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                   <ShieldCheck className="w-4 h-4 text-indigo-500" /> Validation Matrix
                </h4>
                <div className="space-y-4">
                  {Object.entries(od.verificationDetails || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/20 transition-all">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</p>
                      <div className={`flex items-center gap-2 group`}>
                         <div className={`w-2 h-2 rounded-full ${val ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'}`}></div>
                         <span className={`text-[9px] font-black uppercase tracking-widest ${val ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {val ? 'Verified' : 'Failed'}
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* Transmission Payload Section */}
             <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                   <FileSearch className="w-4 h-4 text-indigo-500" /> Transmission Payload
                </h4>
                <div className="space-y-1">
                   <PremiumRow label="Schedule" value={`${new Date(od.startDate).toLocaleDateString()} -> ${new Date(od.endDate).toLocaleDateString()}`} />
                   <PremiumRow label="Bandwidth" value={od.type === 'INTERNAL' ? (() => {
                      const hrs = od.event?.allocatedHours || od.allocatedHours || 0;
                      const h = Math.floor(hrs);
                      const m = Math.round((hrs % 1) * 60);
                      return m > 0 ? `${h}h ${m}m` : `${h} Cycles`;
                   })() : `${od.duration} Cycles`} />
                   
                   {od.type !== 'INTERNAL' && (
                     <div className="space-y-1 mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                       <PremiumFileRow label="Inception Proof" filePath={od.proofFile} />
                       <PremiumFileRow label="Offer Vector" filePath={od.offerFile} />
                       {od.report?.fileUrl && <PremiumFileRow label="Post-Matrix Report" filePath={od.report.fileUrl} />}
                     </div>
                   )}

                   {od.remarks && (
                     <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl">
                        <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2">System Remarks</p>
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-400 italic">"{od.remarks}"</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </main>
      <Footer />

      <InternshipReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        pendingODs={[od]}
        onUploadSuccess={() => {
          setShowReportModal(false);
          fetchOD();
        }}
      />
    </div>
  );
}

function PremiumRow({ label, value }) {
  return (
    <div className="py-3 flex flex-col gap-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{value}</p>
    </div>
  );
}

function PremiumFileRow({ label, filePath }) {
  if (!filePath) return null;
  const fileName = filePath.split(/[\\/]/).pop();

  return (
    <div className="py-3 flex flex-col gap-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center justify-between gap-4 group">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{fileName}</span>
        <a
          href={`${BASE_URL}/${filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          Download <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
