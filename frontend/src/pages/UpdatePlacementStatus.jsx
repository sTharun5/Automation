import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios"; // ✅ Import centralized axios
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import {
  ArrowLeft,
  Calendar,
  History,
  Trash2,
  Briefcase,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function UpdatePlacementStatus() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [existingOffers, setExistingOffers] = useState([]);

  // Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDanger: false
  });

  const [form, setForm] = useState({
    studentId: "",
    rollNo: "",
    status: "",
    companyId: "",
    lpa: "",
    placedDate: ""
  });


  const dateRef = useRef(null);

  /* ================= LOAD INITIAL DATA ================= */
  useEffect(() => {
    // Load Students
    // Load Students (Restricted to Faculty Mentees)
    api
      .get("/faculty/mentees")
      .then((res) => setStudents(res.data))
      .catch(() => showToast("Failed to load students", "error"));

    // Load Approved Companies
    api
      .get("/admin/companies?approvedOnly=true")
      .then((res) => setCompanies(res.data))
      .catch(() => showToast("Failed to load approved companies", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= FORMAT DATE ================= */
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
  };

  /* ================= STUDENT SELECT ================= */
  const handleStudentChange = async (id) => {
    if (!id) {
      setForm({ ...form, studentId: "", rollNo: "" });
      setSelectedStudent(null);
      setExistingOffers([]);
      return;
    }
    const student = students.find((s) => s.id === Number(id));
    if (student) {
      setSelectedStudent(student);
      setForm({
        ...form,
        studentId: id,
        rollNo: student.rollNo,
        status: "",
        companyId: "",
        lpa: "",
        placedDate: ""
      });

      // Fetch existing offers for history
      try {
        const res = await api.get(`/faculty/mentee/${id}`);
        setExistingOffers(res.data.offers || []);
      } catch (err) {
        console.error("Failed to load mentee offers", err);
      }
    }
  };


  /* ================= SUBMIT ================= */
  /* ================= REMOVE OFFER ================= */
  const confirmRemoveOffer = async (offerId) => {
    try {
      await api.delete(`/students/offer/${offerId}`);
      showToast("Offer removed successfully", "success");

      // Refresh offers
      if (form.studentId) {
        const res = await api.get(`/faculty/mentee/${form.studentId}`);
        setExistingOffers(res.data.offers || []);
        setSelectedStudent(res.data);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove offer", "error");
    } finally {
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  const handleRemoveOffer = (offerId) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Offer",
      message: "Are you sure you want to remove this offer? This action cannot be undone.",
      onConfirm: () => confirmRemoveOffer(offerId),
      isDanger: true,
      confirmText: "Yes, Remove"
    });
  };

  const handleSubmit = async () => {
    if (!form.studentId || !form.status) {
      showToast("Student and status are required", "warning");
      return;
    }

    if (form.status === "PLACED" && (!form.companyId || !form.placedDate)) {
      showToast("Company and placed date are required", "warning");
      return;
    }

    try {
      if (form.status === "PLACED") {
        // Add the offer
        await api.post("/students/add-offer", {
          studentId: form.studentId,
          companyId: form.companyId,
          lpa: form.lpa,
          placedDate: form.placedDate
        });
      } else {
        // Update status only (e.g. NIP or YET_TO_BE_PLACED)
        await api.put(`/admin/update-student-status`, {
          studentId: form.studentId,
          placement_status: form.status
        });
      }

      showToast("Status updated successfully", "success");

      // Refresh student and offers if still on same student
      if (form.studentId) {
        const res = await api.get(`/faculty/mentee/${form.studentId}`);
        setExistingOffers(res.data.offers || []);
        setSelectedStudent(res.data); // ✅ Refresh selected student to update status chips
      }

      setForm({
        ...form,
        status: "",
        companyId: "",
        lpa: "",
        placedDate: ""
      });

    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">Matrix Update</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">Synchronize student placement dossiers.</p>
            </div>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-800 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm active:scale-95 group shrink-0"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors"></div>
              
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
                <Briefcase className="w-4 h-4 text-indigo-500" /> Dispatch Update
              </h2>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Subject Identification *</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="font-sans">Access Registry...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id} className="font-sans">
                        {s.rollNo} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Placement Dimension *</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                        companyId: "",
                        placedDate: ""
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="font-sans">Define Status...</option>
                    <option value="PLACED" className="font-sans">Placed</option>
                    <option value="YET_TO_BE_PLACED" className="font-sans">Yet to be Placed</option>
                    <option value="NIP" className="font-sans">NIP (Not Interested in Placement)</option>
                  </select>
                </div>
              </div>
            </div>

            {form.status === "PLACED" && (
              <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none animate-slide-up space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Company Host *</label>
                  <select
                    value={form.companyId}
                    onChange={(e) =>
                      setForm({ ...form, companyId: e.target.value })
                    }
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="font-sans">Sanctioned Corporations...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id} className="font-sans">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Access restricted to verified partners.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Comp Dimension (LPA)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 12"
                      value={form.lpa}
                      onChange={(e) =>
                        setForm({ ...form, lpa: e.target.value })
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">LPA</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Temporal Anchor *</label>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => dateRef.current?.showPicker()}
                  >
                    <input
                      readOnly
                      value={formatDate(form.placedDate)}
                      placeholder="DD-MM-YYYY"
                      className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black uppercase tracking-tight text-xs pr-12"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <input
                      ref={dateRef}
                      type="date"
                      value={form.placedDate}
                      onChange={(e) =>
                        setForm({ ...form, placedDate: e.target.value })
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 px-10 py-5 rounded-[1.5rem] font-black text-white uppercase tracking-[0.2em] text-[10px] sm:text-xs transition-all shadow-2xl shadow-indigo-500/30 active:scale-95 group"
              >
                {form.status === "PLACED" ? "Commit Placement Offer" : "Update Matrix Status"}
                <CheckCircle2 className="w-4 h-4 inline-block ml-3 group-hover:scale-125 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Sidebar: History */}
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none h-fit">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" /> Dossier Backlog
            </h3>
            {!selectedStudent ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Select biological subject to access archives.</p>
              </div>
            ) : existingOffers.length > 0 ? (
              <div className="space-y-4">
                {existingOffers.map((offer, idx) => (
                  <div key={idx} className="group/offer p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800/50 relative overflow-hidden transition-all hover:border-indigo-500/30">
                    <button
                      onClick={() => handleRemoveOffer(offer.id)}
                      className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover/offer:opacity-100 transition-all p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                      title="Decommission Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <p className="font-black text-slate-900 dark:text-white pr-8 uppercase tracking-tight text-xs leading-tight mb-2">{offer.company.name}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(offer.placedDate).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">{offer.lpa} LPA</span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 text-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800">Count: {existingOffers.length}</span>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-slate-200 dark:text-slate-700" />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Null records found in current sector history.</p>
              </div>
            )}

            {selectedStudent && (
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Live Status</p>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl border flex items-center justify-center w-full shadow-sm ${selectedStudent.placement_status === 'PLACED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  selectedStudent.placement_status === 'NIP' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                  }`}>
                  {selectedStudent.placement_status || 'YET_TO_BE_PLACED'}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
      <ConfirmationModal
        {...confirmModal}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
      <Footer />
    </div>
  );
}
