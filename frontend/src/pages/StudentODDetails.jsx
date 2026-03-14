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
  Check
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
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium w-fit bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {needsReport && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Internship Report Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {od.report?.status === "PENDING"
                    ? "Your report is currently under review."
                    : "You must submit an internship report for this completed OD to apply for future ODs."}
                </p>
              </div>
            </div>
            {(!od.report || od.report.status !== "PENDING") && (
              <button
                onClick={() => setShowReportModal(true)}
                className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" /> Submit Report
              </button>
            )}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              <Activity className="w-5 h-5 text-blue-500" /> On-Duty Application Details
            </h2>
          </div>

          {/* ⏱️ REAL-TIME TRACKING HEADER */}
          <div className="px-6 py-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md border shadow-sm ${getLiveStatus(od.startDate, od.endDate, od.status).color}`}>
                  {getLiveStatus(od.startDate, od.endDate, od.status).label}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {progressPercent}% {isApproved ? "Time Elapsed" : "Processing"}
                </span>
              </div>
              <div className="text-right">
                {isApproved ? (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {getElapsedDays(od.startDate, od.endDate, od.status, od.duration)} / {od.duration} Days
                  </span>
                ) : (
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {getProgressLabel(od.status)}
                  </span>
                )}
              </div>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${od.status === 'REJECTED' ? 'bg-red-500' :
                  isApproved ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    'bg-gradient-to-r from-blue-500 to-indigo-500 relative'
                  }`}
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer effect only for pending states */}
                {!isApproved && od.status !== 'REJECTED' && (
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
            {/* Activity ID & Tracker ID */}
            <div className="grid grid-cols-2 gap-4 px-6 py-6 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Tracker ID</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{od.trackerId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Activity ID</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{od.activityId || "PENDING"}</p>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="px-6 py-8">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                <History className="w-3.5 h-3.5" /> Application Lifecycle
              </h4>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {(od.timeline || []).map((step, idx) => (
                  <div key={idx} className="relative pl-10 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 ${step.status === "REJECTED" ? "bg-red-500 border-red-100 dark:border-red-950" :
                      idx === (od.timeline.length - 1) && !isApproved ? "bg-blue-600 border-blue-100 dark:border-blue-950 animate-pulse" :
                        "bg-green-500 border-green-100 dark:border-green-950"
                      }`} />
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white capitalize leading-tight">{step.label}</h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{new Date(step.time).toLocaleString()}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Table */}
            <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/10">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                <FileCheck2 className="w-3.5 h-3.5" /> Verification Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(od.verificationDetails || {}).map(([key, val]) => (
                  <div key={key} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">{key}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${val ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {val ? 'VERIFIED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Standard Info */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <Row label={od.type === 'INTERNAL' ? "Event Name" : "Industry"} value={od.type === 'INTERNAL' ? (od.event?.name || "Internal Event") : (od.offer?.company?.name || od.verificationDetails?.company?.searched || "—")} />
              <Row label="Dates" value={`${new Date(od.startDate).toLocaleDateString()} to ${new Date(od.endDate).toLocaleDateString()} (${od.type === 'INTERNAL' ? (() => {
                const hrs = od.event?.allocatedHours || od.allocatedHours || 0;
                const h = Math.floor(hrs);
                const m = Math.round((hrs % 1) * 60);
                return m > 0 ? `${h}h ${m}m` : `${h} Hours`;
              })() : `${od.duration} days`})`} />

              {od.type !== 'INTERNAL' && (
                <>
                  <FileRow label="Aim & Objective" filePath={od.proofFile} />
                  <FileRow label="Offer Letter" filePath={od.offerFile} />
                  {od.report?.fileUrl && (
                    <FileRow label="Internship Report" filePath={od.report.fileUrl} />
                  )}
                  {od.report?.status && (
                    <Row label="Report Status" value={od.report.status} status />
                  )}
                  {od.report?.remarks && (
                    <Row label="Report Remarks" value={od.report.remarks} danger />
                  )}
                </>
              )}
              <Row label="Current Status" value={statusText} status />
              {od.remarks && <Row label="Mentor Remarks" value={od.remarks} danger />}
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
          fetchOD(); // Refresh data to show report status
        }}
      />
    </div>
  );
}

function Row({ label, value, highlight, status, danger }) {
  let valueClass = "text-slate-700 dark:text-slate-300";
  if (highlight) valueClass = "text-blue-600 dark:text-blue-400 font-semibold";
  if (status) valueClass = "text-amber-600 dark:text-amber-400 font-semibold";
  if (danger) valueClass = "text-red-600 dark:text-red-400";

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <div className="col-span-1 text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`col-span-2 ${valueClass}`}>{value}</div>
    </div>
  );
}

function FileRow({ label, filePath }) {
  if (!filePath) {
    return (
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        <div className="col-span-1 text-slate-500 dark:text-slate-400">{label}</div>
        <div className="col-span-2 text-slate-500 dark:text-slate-400">Not uploaded</div>
      </div>
    );
  }

  const fileName = filePath.split(/[\\/]/).pop();

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <div className="col-span-1 text-slate-500 dark:text-slate-400">{label}</div>
      <div className="col-span-2 flex flex-col gap-2">
        <span className="text-slate-700 dark:text-slate-300 break-all">{fileName}</span>
        <a
          href={`${BASE_URL}/${filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
    </div>
  );
}
