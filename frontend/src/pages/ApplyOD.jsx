import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VerificationResultModal from "../components/VerificationResultModal";
import { useToast } from "../context/ToastContext";

export default function ApplyOD() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const navigate = useNavigate();

  // ✅ Auto-set student ID from session
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  // Modal state for verification results
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [verificationSummary, setVerificationSummary] = useState("");

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

    const token = sessionStorage.getItem("token");
    axios
      .get(`http://localhost:3000/api/students/${form.studentId}/offers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
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

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      if (!form.aimFile || !form.offerFile) {
        showToast("Please upload both documents", "warning");
        return;
      }

      const token = sessionStorage.getItem("token");

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await axios.post(
        "http://localhost:3000/api/od/apply",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
          <span>←</span> Back
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Offer <span className="text-red-500">*</span></label>
            <select
              value={form.offerId}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) => {
                const offerId = e.target.value;
                const selectedOffer = offers.find(o => o.id === Number(offerId));
                setForm({ ...form, offerId });

                if (selectedOffer && !selectedOffer.company.isApproved) {
                  setError(`Warning: ${selectedOffer.company.name} is not on the approved list. This OD might be automatically rejected.`);
                } else {
                  setError("");
                }
              }}
            >
              <option value="">{offers.length > 0 ? "Click to choose" : "Loading offers..."}</option>
              {offers.filter(o => o.company.isApproved).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.company.name} ({o.lpa} LPA)
                </option>
              ))}
            </select>
            {offers.length > 0 && offers.filter(o => o.company.isApproved).length === 0 && (
              <p className="text-red-500 text-xs mt-1">None of your offers are from approved companies. You are not eligible for OD.</p>
            )}
            {offers.length === 0 && (
              <p className="text-amber-500 text-xs mt-1">No offers found. Please contact the placement cell or admin.</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industry <span className="text-red-500">*</span></label>
            <select
              value={form.industry}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, industry: e.target.value })
              }
            >
              <option value="">Click to choose</option>
              <option>IT</option>
              <option>Core</option>
              <option>Research</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campus Type <span className="text-red-500">*</span></label>
            <select
              value={form.campusType}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) =>
                setForm({ ...form, campusType: e.target.value })
              }
            >
              <option value="">Click to choose</option>
              <option>On Campus</option>
              <option>Off Campus</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              onChange={(e) => {
                const start = e.target.value;
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
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50">
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
                Choose File
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) =>
                    setForm({ ...form, aimFile: e.target.files[0] })
                  }
                />
              </label>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {form.aimFile ? form.aimFile.name : "Drop file or click to choose"}
              </p>
            </div>

            <p className="text-red-500 dark:text-red-400 text-sm mt-2">
              * Please find the Aim & Objective Format{" "}
              <a
                href="https://docs.google.com/document/d/1hLskJVGM2grFym9h4MGY4eTPSouzU2Nk/view"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
              >
                here
              </a>
            </p>
            <p className="text-red-500 dark:text-red-400 text-sm">
              * Please specify the Proof name only in the following format<br />
              <span className="ml-4">201CS111-ITI-08.06.2025</span>
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Offer Letter <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50">
              <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
                Choose File
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={(e) =>
                    setForm({ ...form, offerFile: e.target.files[0] })
                  }
                />
              </label>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {form.offerFile ? form.offerFile.name : "Drop file or click to choose"}
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
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-white transition-colors"
            >
              Submit Application
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
    </div >
  );
}
