import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updatePlacementStatus } from "../api/placementStatus"; // ✅ Import helper
import api from "../api/axios"; // ✅ Import centralized axios
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../context/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function UpdatePlacementStatus() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const faculty = JSON.parse(sessionStorage.getItem("user"));
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
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
        >
          <span>←</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm transition-colors">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">
              Update Student Placement Status
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student *</label>
              <select
                value={form.studentId}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              >
                <option value="">Click to choose</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNo} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Placement Status *</label>
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
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
              >
                <option value="">Click to choose</option>
                <option value="PLACED">Placed</option>
                <option value="YET_TO_BE_PLACED">Yet to be Placed</option>
                <option value="NIP">NIP</option>
              </select>
            </div>

            {form.status === "PLACED" && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company (Approved Only) *</label>
                  <select
                    value={form.companyId}
                    onChange={(e) =>
                      setForm({ ...form, companyId: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
                  >
                    <option value="">Select an approved company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500 italic">Only companies approved by the admin are shown here.</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Salary Package (LPA)</label>
                  <input
                    type="text"
                    placeholder="e.g. 12"
                    value={form.lpa}
                    onChange={(e) =>
                      setForm({ ...form, lpa: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-900 dark:text-white transition-colors"
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Placed Date *</label>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => dateRef.current?.showPicker()}
                  >
                    <input
                      readOnly
                      value={formatDate(form.placedDate)}
                      placeholder="DD-MM-YYYY"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 pr-10 cursor-pointer text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3 top-3 text-slate-500 dark:text-slate-400">📅</span>
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
              </>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-white transition-colors shadow-lg shadow-blue-500/20"
              >
                {form.status === "PLACED" ? "Add Placement Offer" : "Update Status"}
              </button>
            </div>
          </div>

          {/* Right Sidebar: History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors h-fit">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🕒</span> Placement History
            </h3>
            {!selectedStudent ? (
              <p className="text-sm text-slate-500 italic">Select a student to view history</p>
            ) : existingOffers.length > 0 ? (
              <div className="space-y-4">
                {existingOffers.map((offer, idx) => (
                  <div key={idx} className="group/offer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 relative">
                    <button
                      onClick={() => handleRemoveOffer(offer.id)}
                      className="absolute top-2 right-2 text-red-500 opacity-0 group-hover/offer:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Offer"
                    >
                      🗑️
                    </button>
                    <p className="font-bold text-slate-900 dark:text-white pr-6">{offer.company.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-slate-500">{new Date(offer.placedDate).toLocaleDateString('en-GB')}</span>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{offer.lpa} LPA</span>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Total Offers: {existingOffers.length}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No offers recorded yet for this student.</p>
            )}

            {selectedStudent && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${selectedStudent.placement_status === 'PLACED' ? 'bg-green-100 text-green-700' :
                  selectedStudent.placement_status === 'NIP' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
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
