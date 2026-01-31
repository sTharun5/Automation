import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOdById } from "../services/odService";

export default function StudentODDetails() {
  const { odId } = useParams();
  const [od, setOd] = useState(null);

  useEffect(() => {
    getOdById(odId)
      .then((res) => setOd(res.data))
      .catch((err) => console.error(err));
  }, [odId]);

  if (!od) {
    return <p className="text-center text-slate-400">Loading...</p>;
  }

  // 🔹 Status mapping
  const statusText =
    od.status === "PENDING" ? "Initiated" : od.status;

  return (
    <div className="min-h-screen bg-[#0b1220] flex justify-center py-10 px-4">
      <div className="w-full max-w-5xl bg-[#111c2e] rounded-xl shadow-lg overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-slate-200">
            On-Duty Application Details
          </h2>
        </div>

        <div className="divide-y divide-slate-700 text-slate-300">

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
    </div>
  );
}

/* ================= REUSABLE ROW ================= */

function Row({ label, value, highlight, status, danger }) {
  let valueClass = "text-slate-200";

  if (highlight) valueClass = "text-blue-400 font-semibold";
  if (status) valueClass = "text-yellow-400 font-semibold";
  if (danger) valueClass = "text-red-400";

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <div className="col-span-1 text-slate-400">{label}</div>
      <div className={`col-span-2 ${valueClass}`}>{value}</div>
    </div>
  );
}

/* ================= FILE ROW ================= */

function FileRow({ label, filePath }) {
  if (!filePath) {
    return (
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        <div className="col-span-1 text-slate-400">{label}</div>
        <div className="col-span-2 text-slate-500">
          Not uploaded
        </div>
      </div>
    );
  }

  // extract filename only
  const fileName = filePath.split(/[\\/]/).pop();

  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4">
      <div className="col-span-1 text-slate-400">{label}</div>

      <div className="col-span-2 flex flex-col gap-2">
        {/* ✅ FILENAME ONLY */}
        <span className="text-slate-200 break-all">
          {fileName}
        </span>

        {/* ✅ DOWNLOAD */}
        <a
          href={`http://localhost:3000/${filePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:underline"
        >
          ⬇ Download
        </a>
      </div>
    </div>
  );
}
