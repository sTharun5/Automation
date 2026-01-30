import { useEffect, useState, useRef } from "react";
import axios from "axios";

export default function UpdatePlacementStatus() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [form, setForm] = useState({
  studentId: "",
  rollNo: "",
  status: "",
  companyName: "",
  placedDate: ""
});


  const dateRef = useRef(null);
  const token = localStorage.getItem("token");

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/students/list", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setStudents(res.data))
      .catch(() => alert("Failed to load students"));
  }, [token]);

  /* ================= FORMAT DATE ================= */
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y}`;
  };

  /* ================= STUDENT SELECT ================= */
 const handleStudentChange = (id) => {
  const student = students.find((s) => s.id === Number(id));
  setSelectedStudent(student);

  setForm({
    ...form,
    studentId: id,
    rollNo: student.rollNo // ✅ IMPORTANT
  });
};


  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!form.studentId || !form.status) {
      alert("Student and status are required");
      return;
    }

    if (form.status === "PLACED" && (!form.companyName || !form.placedDate)) {
      alert("Company name and placed date are required");
      return;
    }

    try {
      await axios.post(
  "http://localhost:5000/api/placement-status/set",
  {
    rollNo: form.rollNo,          // ✅ REQUIRED
    status: form.status,
    companyName: form.companyName,
    placedDate: form.placedDate
  },
  { headers: { Authorization: `Bearer ${token}` } }
);


      alert("Placement status updated successfully");

      setForm({
  studentId: "",
  rollNo: "",
  status: "",
  companyName: "",
  placedDate: ""
});

      setSelectedStudent(null);

    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-[#111c2e] rounded-2xl p-10 shadow-xl text-slate-200">

        <h2 className="text-2xl font-semibold mb-8">
          Update Student Placement Status
        </h2>

        {/* STUDENT */}
        <div className="mb-6">
          <label>Student *</label>
          <select
            value={form.studentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
          >
            <option value="">Click to choose</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.rollNo}
              </option>
            ))}
          </select>
        </div>

        {/* NAME */}
        {selectedStudent && (
          <div className="mb-6">
            <label>Student Name</label>
            <input
              readOnly
              value={selectedStudent.name}
              className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3"
            />
          </div>
        )}

        {/* STATUS */}
        <div className="mb-6">
          <label>Placement Status *</label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
                companyName: "",
                placedDate: ""
              })
            }
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
          >
            <option value="">Click to choose</option>
            <option value="PLACED">Placed</option>
            <option value="YET_TO_BE_PLACED">Yet to be Placed</option>
            <option value="NIP">NIP</option>
          </select>
        </div>

        {/* COMPANY */}
        {form.status === "PLACED" && (
          <div className="mb-6">
            <label>Company Name *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
            />
          </div>
        )}

        {/* DATE PICKER (LIKE IMAGE) */}
        {form.status === "PLACED" && (
          <div className="mb-8">
            <label>Placed Date *</label>

            <div
              className="relative cursor-pointer"
              onClick={() => dateRef.current.showPicker()}
            >
              {/* DISPLAY INPUT */}
              <input
                readOnly
                value={formatDate(form.placedDate)}
                placeholder="DD-MM-YYYY"
                className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3 pr-10 cursor-pointer"
              />

              {/* CALENDAR ICON */}
              <span className="absolute right-3 top-3 text-slate-400">
                📅
              </span>

              {/* REAL DATE INPUT (HIDDEN) */}
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
        )}

        {/* BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
          >
            Update Placement
          </button>
        </div>

      </div>
    </div>
  );
}
