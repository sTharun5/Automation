import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VerificationResultModal from "../components/VerificationResultModal";
import InternshipReportModal from "../components/InternshipReportModal"; // ✅ Import Modal
import { useToast } from "../context/ToastContext";
import SearchableSelect from "../components/SearchableSelect";
import LoadingButton from "../components/LoadingButton";
import api from "../api/axios";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Briefcase,
  Monitor,
  Settings,
  Beaker,
  School,
  Car,
  Upload,
  ExternalLink,
  ChevronRight
} from "lucide-react";

/**
 * ApplyOD component - Multi-step application wizard for On-Duty requests.
 * Orchestrates offer selection, date validation, exam conflict checking, 
 * and AI-integrated document uploads for student placement and internship activities.
 */
export default function ApplyOD() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();

  // ✅ Auto-set student ID from session
  const [offers, setOffers] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Modal state for verification results
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [verificationSummary, setVerificationSummary] = useState("");

  // Per-field file validation errors
  const [fileErrors, setFileErrors] = useState({ aimFile: "", offerFile: "" });

  // ✅ Internship Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingODs, setPendingODs] = useState([]); // ✅ Store pending ODs

  /* ================= LOAD CALENDAR EVENTS ================= */
  useEffect(() => {
    api
      .get("/calendar")
      .then((res) => setCalendarEvents(res.data))
      .catch((err) => console.error("Failed to fetch calendar", err));
  }, []);

  const [form, setForm] = useState({
    studentId: user?.id || "", // ✅ Auto-fill
    offerId: "",
    industry: "",
    campusType: "",
    startDate: "",
    endDate: "",
    duration: "",
    aimFile: null,
    offerFile: null,
    iqacStatus: "Initiated"
  });

  /* ================= LOAD OFFERS AUTOMATICALLY ================= */
  useEffect(() => {
    if (!form.studentId) return;

    api
      .get(`/students/${form.studentId}/offers`)
      .then((res) => setOffers(res.data))
      .catch((err) => {
        console.error("Failed to fetch offers", err);
        setOffers([]);
      });
  }, [form.studentId]);

  /* ================= DURATION WITH 60 DAY LIMIT ================= */
  const calculateDuration = (start, end) => {
    if (!start || !end) return "";

    const s = new Date(start);
    const e = new Date(end);

    const days =
      Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;

    if (days > 60) {
      setError("OD duration should not exceed 60 days");
      return "";
    }

    setError("");
    return days;
  };

  /* ================= FILE FORMAT VALIDATOR ================= */
  /**
   * Validates file name format before accepting the attachment.
   * Expected: ROLLNO-TYPE-DD.MM.YYYY.pdf  (e.g. 7376222AD218-ITI-14.04.2026.pdf)
   * Returns an error string, or "" if valid.
   */
  const validateFileFormat = (file, expectedType) => {
    if (!file) return "No file selected.";

    // 1. Must be PDF
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are accepted.";
    }

    // 2. Strip extension and check regex
    const nameWithoutExt = file.name.slice(0, -4); // remove .pdf
    const regex = /^([A-Z0-9]+)-(ITO|ITI)-(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    if (!regex.test(nameWithoutExt)) {
      return `Invalid filename format. Expected: ${user.rollNo}-${expectedType}-DD.MM.YYYY.pdf`;
    }

    const parts = nameWithoutExt.split("-");
    const fileRollNo = parts[0];
    const fileType   = parts[1];
    const fileDateStr = parts[2]; // DD.MM.YYYY

    // 3. Roll number must match
    if (fileRollNo !== user.rollNo) {
      return `Roll No mismatch: filename has "${fileRollNo}", expected "${user.rollNo}".`;
    }

    // 4. Type must match
    if (fileType !== expectedType) {
      return `Wrong document type: filename has "${fileType}", expected "${expectedType}". (Aim=ITI, Offer=ITO)`;
    }

    // 5. Date must be today
    const [day, month, year] = fileDateStr.split(".").map(Number);
    const fileDate  = new Date(year, month - 1, day);
    const today     = new Date();
    today.setHours(0, 0, 0, 0);
    fileDate.setHours(0, 0, 0, 0);
    if (fileDate.getTime() !== today.getTime()) {
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      return `Filename date "${fileDateStr}" must be today (${dd}.${mm}.${yyyy}).`;
    }

    return ""; // ✅ All checks passed
  };

  const checkDateConflict = (startTime, endTime) => {
    if ((!startTime && !endTime) || !calendarEvents.length) return null;

    const start = startTime ? new Date(startTime).setHours(0, 0, 0, 0) : null;
    const end = endTime ? new Date(endTime).setHours(0, 0, 0, 0) : null;

    return calendarEvents.find(ev => {
      if (ev.type !== "EXAM") return false;
      const evStart = new Date(ev.startDate).setHours(0, 0, 0, 0);
      const evEnd = new Date(ev.endDate).setHours(0, 0, 0, 0);

      // 1. Start inside event
      if (start && start >= evStart && start <= evEnd) return true;
      // 2. End inside event
      if (end && end >= evStart && end <= evEnd) return true;
      // 3. Event inside range (OD envelopes Exam)
      if (start && end && start <= evStart && end >= evEnd) return true;

      return false;
    });
  };

  const [rejectionReasons, setRejectionReasons] = useState([]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (submitting) return;
    setRejectionReasons([]); // clear previous rejection
    try {
      setSubmitting(true);
      if (!form.aimFile || !form.offerFile) {
        showToast("Please upload both documents", "warning");
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await api.post(
        "/od/apply",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

      const odId = res.data.od.id;
      navigate(`/student/od/${odId}`);

    } catch (err) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      const errorData = err.response?.data;

      // ── New: AI verification failed → show reasons on page ──
      if (err.response?.status === 422 && errorData?.rejected) {
        setRejectionReasons(errorData.reasons || ["Document verification failed."]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (errorData?.verificationDetails) {
        setVerificationDetails(errorData.verificationDetails);
        setVerificationSummary(errorData.summary);
        setShowVerificationModal(true);
      } else if (err.response?.status === 403 && errorData?.message === "Internship Report Required") {
        setPendingODs(errorData.pendingODs || []);
        setShowReportModal(true);
      } else {
        showToast(errorData?.message || "Failed to apply OD", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">Apply On-Duty (OD)</h2>

          {/* Read-Only Student Info */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student</label>
            <input
              type="text"
              value={`${user.name} (${user.rollNo})`}
              readOnly
              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
            />
          </div>

          <div className="mb-6">
            <SearchableSelect
              label="Select Offer"
              required
              placeholder={offers.length > 0 ? "Choose your placement offer..." : "Loading offers..."}
              value={form.offerId}
              options={offers.map(o => ({
                value: String(o.id),
                label: o.company.name,
                sublabel: `${o.lpa} LPA • ${o.role || 'Internship'}`,
                icon: o.company.isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Briefcase className="w-4 h-4 text-slate-400" />
              }))}
              onChange={(val) => {
                const selectedOffer = offers.find(o => o.id === Number(val));
                setForm({ ...form, offerId: val });
                if (selectedOffer && !selectedOffer.company.isApproved) {
                  setError(`Warning: ${selectedOffer.company.name} is not on the approved list. This OD might be automatically rejected.`);
                } else {
                  setError("");
                }
              }}
              error={offers.length > 0 && offers.filter(o => o.company.isApproved).length === 0 ? "None of your offers are from approved companies." : ""}
            />
          </div>

          <div className="mb-6">
            <SearchableSelect
              label="Industry"
              required
              placeholder="Select sector..."
              value={form.industry}
              options={[
                { value: "IT", label: "IT / Software", sublabel: "Tech & Services", icon: <Monitor className="w-4 h-4" /> },
                { value: "Core", label: "Core Engineering", sublabel: "Mechanical/Electrical/Civil", icon: <Settings className="w-4 h-4" /> },
                { value: "Research", label: "Research & Development", sublabel: "Academic/Lab work", icon: <Beaker className="w-4 h-4" /> }
              ]}
              onChange={(val) => setForm({ ...form, industry: val })}
            />
          </div>

          <div className="mb-6">
            <SearchableSelect
              label="Campus Type"
              required
              placeholder="Select venue..."
              value={form.campusType}
              options={[
                { value: "On Campus", label: "On Campus", sublabel: "Hostel/Institute venue", icon: <School className="w-4 h-4" /> },
                { value: "Off Campus", label: "Off Campus", sublabel: "External office/venue", icon: <Car className="w-4 h-4" /> }
              ]}
              onChange={(val) => setForm({ ...form, campusType: val })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              aria-label="Application Start Date"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) => {
                const start = e.target.value;
                const conflict = checkDateConflict(start, form.endDate);
                if (conflict) {
                  setError(`Cannot apply during exam: ${conflict.title}.`);
                } else {
                  setError("");
                }

                setForm({
                  ...form,
                  startDate: start,
                  duration: calculateDuration(start, form.endDate)
                });
              }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              aria-label="Application End Date"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) => {
                const end = e.target.value;
                const conflict = checkDateConflict(form.startDate, end);
                if (conflict) {
                  setError(`Cannot apply during exam: ${conflict.title}.`);
                } else {
                  setError("");
                }

                setForm({
                  ...form,
                  endDate: end,
                  duration: calculateDuration(form.startDate, end)
                });
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration in days <span className="text-red-500">*</span></label>
            <input
              readOnly
              value={form.duration}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 mb-4 text-sm">{error}</p>}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aim & Objective <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                <span className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all mb-2">
                  Choose PDF Proof
                </span>
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    e.target.value = ""; // reset so same file can be reselected after fix
                    const err = validateFileFormat(file, "ITI");
                    if (err) {
                      setFileErrors(prev => ({ ...prev, aimFile: err }));
                      setForm(prev => ({ ...prev, aimFile: null }));
                    } else {
                      setFileErrors(prev => ({ ...prev, aimFile: "" }));
                      setForm(prev => ({ ...prev, aimFile: file }));
                    }
                  }}
                />
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {form.aimFile
                  ? <span className="text-emerald-500 font-bold flex items-center gap-1">✅ {form.aimFile.name}</span>
                  : "PDF only — filename must match format below"}
              </p>
              {fileErrors.aimFile && (
                <p className="mt-2 text-red-500 text-xs font-semibold flex items-start gap-1">
                  <span>❌</span> {fileErrors.aimFile}
                </p>
              )}
            </div>

            <p className="text-red-500 dark:text-red-400 text-sm mt-2">
              * Please find the Aim & Objective Format{" "}
              <a
                href="https://docs.google.com/document/d/1hLskJVGM2grFym9h4MGY4eTPSouzU2Nk/view"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 inline-flex items-center gap-1"
              >
                here <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p className="text-red-500 dark:text-red-400 text-sm">
              * Please specify the Proof name only in the following format<br />
              <span className="ml-4">201CS111-ITI-08.06.2025</span>
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Offer Letter <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-8 rounded-2xl text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors mb-4" />
                <span className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all mb-2">
                  Choose Offer Letter
                </span>
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    e.target.value = "";
                    const err = validateFileFormat(file, "ITO");
                    if (err) {
                      setFileErrors(prev => ({ ...prev, offerFile: err }));
                      setForm(prev => ({ ...prev, offerFile: null }));
                    } else {
                      setFileErrors(prev => ({ ...prev, offerFile: "" }));
                      setForm(prev => ({ ...prev, offerFile: file }));
                    }
                  }}
                />
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {form.offerFile
                  ? <span className="text-emerald-500 font-bold flex items-center gap-1">✅ {form.offerFile.name}</span>
                  : "PDF only — filename must match format below"}
              </p>
              {fileErrors.offerFile && (
                <p className="mt-2 text-red-500 text-xs font-semibold flex items-start gap-1">
                  <span>❌</span> {fileErrors.offerFile}
                </p>
              )}
            </div>

            <p className="text-red-500 dark:text-red-400 text-sm mt-2">
              * Please specify the Proof name only in the following format<br />
              <span className="ml-4">201CS111-ITO-08.06.2025</span>
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IQAC Verification <span className="text-red-500">*</span></label>
            <input
              type="text"
              value="Initiated"
              disabled
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">* IQAC status will be updated after document verification</p>
          </div>

          {/* ── AI Rejection Banner ── */}
          {rejectionReasons.length > 0 && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">❌</span>
                <div>
                  <p className="font-bold text-red-700 dark:text-red-400 mb-2">
                    Application Rejected — AI Document Verification Failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    Your documents did not pass verification for the following reason(s). Please fix and reapply:
                  </p>
                  <ul className="space-y-1">
                    {rejectionReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                        <span className="mt-0.5 shrink-0">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <LoadingButton
              isLoading={submitting}
              loadingText="Submitting..."
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-black text-white uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              Submit Application <span className="ml-1">›</span>
            </LoadingButton>
          </div>
        </div>
      </main >
      <Footer />
      <VerificationResultModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        verificationDetails={verificationDetails}
        summary={verificationSummary}
      />
      <InternshipReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        pendingODs={pendingODs}
        onUploadSuccess={() => {
          showToast("Report submitted for review. Please wait for approval.", "success");
          // Optionally, you could disable the form or redirect
        }}
      />
    </div >
  );
}
