import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOdById } from "../services/odService";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function StudentODDetails() {
  const { odId } = useParams();
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              On-Duty Application Details
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">

          {/* 🔹 TRACKER ID (NOT DB ID) */}
          <Row
            label="Tracker ID"
            value={od.trackerId}
            highlight
          />

          {/* Student */}
          <Row
            label="Student"
            value={od.rollNo}
          />

          {/* Industry */}
          <Row label="Industry" value={od.industry || "—"} />

          {/* Start Date */}
          <Row
            label="Start Date"
            value={new Date(od.startDate).toLocaleDateString()}
          />

          {/* End Date */}
          <Row
            label="End Date"
            value={new Date(od.endDate).toLocaleDateString()}
          />

          {/* Duration */}
          <Row
            label="Duration in days"
            value={od.duration}
          />

          {/* Aim & Objective */}
          <FileRow
            label="Aim & Objective"
            filePath={od.proofFile}
          />

          {/* ✅ Offer Letter DOWNLOAD ENABLED */}
          <FileRow
            label="Offer Letter"
            filePath={od.offerFile}
          />

          {/* IQAC Verification */}
          <Row
            label="IQAC Verification"
            value={statusText}
            status
          />

          {/* Remarks (if admin adds later) */}
          {od.remarks && (
            <Row
              label="Remarks"
              value={od.remarks}
              danger
            />
          )}
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
