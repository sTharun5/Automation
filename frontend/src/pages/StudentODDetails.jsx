import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOdById } from "../services/odService";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function StudentODDetails() {
  const { odId } = useParams();
  const navigate = useNavigate();
  const [od, setOd] = useState(null);

  useEffect(() => {
    getOdById(odId)
      .then((res) => setOd(res.data))
      .catch((err) => console.error(err));
  }, [odId]);

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

  const statusText = od.status === "PENDING" ? "Initiated" : od.status;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
        >
          <span>←</span> Back
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              On-Duty Application Details
            </h2>
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
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Application Lifecycle</h4>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                {(od.timeline || []).map((step, idx) => (
                  <div key={idx} className="relative pl-10 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 ${step.status === "REJECTED" ? "bg-red-500 border-red-100 dark:border-red-950" :
                        idx === (od.timeline.length - 1) ? "bg-blue-600 border-blue-100 dark:border-blue-950 animate-pulse" :
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
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">Verification Details</h4>
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
              <Row label="Industry" value={od.industry || od.verificationDetails?.company || "—"} />
              <Row label="Dates" value={`${new Date(od.startDate).toLocaleDateString()} to ${new Date(od.endDate).toLocaleDateString()} (${od.duration} days)`} />
              <FileRow label="Aim & Objective" filePath={od.proofFile} />
              <FileRow label="Offer Letter" filePath={od.offerFile} />
              <Row label="Current Status" value={statusText} status />
              {od.remarks && <Row label="Mentor Remarks" value={od.remarks} danger />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
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
          href={`http://localhost:3000/${filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ⬇ Download
        </a>
      </div>
    </div>
  );
}
