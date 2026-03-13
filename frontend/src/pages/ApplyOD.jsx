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


      // ✅ ONLY NEW FUNCTIONALITY (NO UI CHANGE)
      const odId = res.data.od.id;
      navigate(`/student/od/${odId}`);

    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.verificationDetails) {
        setVerificationDetails(errorData.verificationDetails);
        setVerificationSummary(errorData.summary);
        setShowVerificationModal(true);
      } else if (err.response?.status === 403 && errorData?.message === "Internship Report Required") {
        // Pass pending ODs to modal
        setPendingODs(errorData.pendingODs || []);
        setShowRepor      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to Terminal
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-6 sm:p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="mb-10 sm:mb-12 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Post-Dispatch Application</h2>
            <div className="h-1.5 w-20 bg-indigo-600 rounded-full"></div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-6">Secure On-Duty Authorization Protocol</p>
          </div>

          <div className="space-y-8 sm:space-y-10 relative z-10">
            {/* Read-Only Student Info */}
            <div className="relative group/field">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Active Personnel</label>
              <div className="relative">
                <input
                  type="text"
                  value={`${user.name} (${user.rollNo})`}
                  readOnly
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed transition-all"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <SearchableSelect
                label="Target Offer Letter"
                required
                placeholder={offers.length > 0 ? "Select identification..." : "Scanning offers..."}
                value={form.offerId}
                options={offers.map(o => ({
                  value: String(o.id),
                  label: o.company.name,
                  sublabel: `${o.lpa} LPA • ${o.role || 'Personnel'}`,
                  icon: o.company.isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Briefcase className="w-4 h-4 text-slate-400" />
                }))}
                onChange={(val) => {
                  const selectedOffer = offers.find(o => o.id === Number(val));
                  setForm({ ...form, offerId: val });
                  if (selectedOffer && !selectedOffer.company.isApproved) {
                    setError(`Mission Alert: ${selectedOffer.company.name} is not on the authorized list. Authorization may be revoked.`);
                  } else {
                    setError("");
                  }
                }}
                error={offers.length > 0 && offers.filter(o => o.company.isApproved).length === 0 ? "No authorized sectors found in your profile." : ""}
              />

              <SearchableSelect
                label="Sector Classification"
                required
                placeholder="Classification..."
                value={form.industry}
                options={[
                  { value: "IT", label: "IT / Software", sublabel: "Cyber-Tech", icon: <Monitor className="w-4 h-4" /> },
                  { value: "Core", label: "Core Systems", sublabel: "Physical Infra", icon: <Settings className="w-4 h-4" /> },
                  { value: "Research", label: "R & D", sublabel: "Lab Operations", icon: <Beaker className="w-4 h-4" /> }
                ]}
                onChange={(val) => setForm({ ...form, industry: val })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <SearchableSelect
                label="Deployment Venue"
                required
                placeholder="Target location..."
                value={form.campusType}
                options={[
                  { value: "On Campus", label: "Internal Node", sublabel: "Institute Perimeter", icon: <School className="w-4 h-4" /> },
                  { value: "Off Campus", label: "External Node", sublabel: "Remote Operative", icon: <Car className="w-4 h-4" /> }
                ]}
                onChange={(val) => setForm({ ...form, campusType: val })}
              />

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Timeframe Window <span className="text-indigo-500">*</span></label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    onChange={(e) => {
                      const start = e.target.value;
                      const conflict = checkDateConflict(start, form.endDate);
                      if (conflict) {
                        setError(`Sync Conflict: ${conflict.title} detected.`);
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
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                    onChange={(e) => {
                      const end = e.target.value;
                      const conflict = checkDateConflict(form.startDate, end);
                      if (conflict) {
                        setError(`Sync Conflict: ${conflict.title} detected.`);
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Operational Span</label>
                <div className="relative">
                  <input
                    readOnly
                    value={form.duration ? `${form.duration} Cycles` : ""}
                    placeholder="Calculating span..."
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-not-allowed transition-all"
                  />
                  <div className="absolute left-0 bottom-0 h-1 bg-indigo-600 rounded-full transition-all duration-700" style={{ width: form.duration ? `${Math.min((form.duration / 60) * 100, 100)}%` : '0%' }}></div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Verification Status</label>
                <input
                  type="text"
                  value="DEFERRED"
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 animate-shake flex items-center gap-3">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></div>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mission Objective <span className="text-indigo-500">*</span></label>
                <div className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center bg-slate-50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    hidden
                    id="aimFile"
                    accept="application/pdf"
                    onChange={(e) => setForm({ ...form, aimFile: e.target.files[0] })}
                  />
                  <label htmlFor="aimFile" className="cursor-pointer flex flex-col items-center">
                    <Upload className={`w-10 h-10 mb-4 transition-all duration-500 ${form.aimFile ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-indigo-500 group-hover:scale-110'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {form.aimFile ? <span className="text-emerald-500">Payload Ready</span> : "Upload Objective PDF"}
                    </span>
                    {form.aimFile && <p className="text-[8px] mt-2 font-bold text-slate-400 truncate max-w-[200px]">{form.aimFile.name}</p>}
                  </label>
                </div>
                <div className="flex flex-col gap-2 px-2">
                  <a
                    href="https://docs.google.com/document/d/1hLskJVGM2grFym9h4MGY4eTPSouzU2Nk/view"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 flex items-center gap-2"
                  >
                    Download Template <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Format: RollNo-ITI-Date.pdf</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Official Credentials <span className="text-indigo-500">*</span></label>
                <div className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center bg-slate-50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    hidden
                    id="offerFile"
                    accept="application/pdf"
                    onChange={(e) => setForm({ ...form, offerFile: e.target.files[0] })}
                  />
                  <label htmlFor="offerFile" className="cursor-pointer flex flex-col items-center">
                    <Upload className={`w-10 h-10 mb-4 transition-all duration-500 ${form.offerFile ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-indigo-500 group-hover:scale-110'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {form.offerFile ? <span className="text-emerald-500">Credentials Sealed</span> : "Upload Offer PDF"}
                    </span>
                    {form.offerFile && <p className="text-[8px] mt-2 font-bold text-slate-400 truncate max-w-[200px]">{form.offerFile.name}</p>}
                  </label>
                </div>
                <div className="flex flex-col gap-2 px-2">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Format: RollNo-ITO-Date.pdf</p>
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Final Handshake</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Verify all sectors before sync</p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-500/20 hover:scale-[1.05] active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                Secure Dispatch <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
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
        }}
      />
    </div>
  );
}
