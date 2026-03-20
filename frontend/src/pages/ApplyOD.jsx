import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VerificationResultModal from "../components/VerificationResultModal";
import InternshipReportModal from "../components/InternshipReportModal"; // ✅ Import Modal
import { useToast } from "../context/ToastContext";
import SearchableSelect from "../components/SearchableSelect";
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
  const [calendarEvents, setCalendarEvents] = useState([]); // ✅ Calendar Events
  const [error, setError] = useState("");
  const { showToast } = useToast();

  // Modal state for verification results
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [verificationSummary, setVerificationSummary] = useState("");

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

  /* ================= CHECK DATE CONFLICT ================= */
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

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
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

      if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Success vibration


      // ✅ ONLY NEW FUNCTIONALITY (NO UI CHANGE)
      const odId = res.data.od.id;
      navigate(`/student/od/${odId}`);

    } catch (err) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Error vibration
      
      const errorData = err.response?.data;
      if (errorData?.verificationDetails) {
        setVerificationDetails(errorData.verificationDetails);
        setVerificationSummary(errorData.summary);
        setShowVerificationModal(true);
      } else if (err.response?.status === 403 && errorData?.message === "Internship Report Required") {
        // Pass pending ODs to modal
        setPendingODs(errorData.pendingODs || []);
        setShowReportModal(true);
      } else {
        showToast(errorData?.message || "Failed to apply OD", "error");
      }
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
                  onChange={(e) =>
                    setForm({ ...form, aimFile: e.target.files[0] })
                  }
                />
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {form.aimFile ? <span className="text-blue-500 font-bold">{form.aimFile.name}</span> : "PDF only (Max 2MB)"}
              </p>
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
                  onChange={(e) =>
                    setForm({ ...form, offerFile: e.target.files[0] })
                  }
                />
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {form.offerFile ? <span className="text-blue-500 font-bold">{form.offerFile.name}</span> : "PDF only (Max 2MB)"}
              </p>
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

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-black text-white uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              Submit Application <ChevronRight className="w-5 h-5" />
            </button>
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
