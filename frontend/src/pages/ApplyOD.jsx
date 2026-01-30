import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ApplyOD() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    studentId: "",
    industry: "",
    campusType: "",
    startDate: "",
    endDate: "",
    duration: "",
    aimFile: null,
    offerFile: null,
    iqacStatus: "Initiated"
  });

  /* ================= LOAD STUDENTS ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/students/list", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => setStudents(res.data))
      .catch((err) => {
        console.error("Failed to fetch students", err);
      });
  }, []);

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
        alert("Please upload both documents");
        return;
      }

      const token = localStorage.getItem("token");

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await axios.post(
  "http://localhost:5000/api/od/apply",
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
      alert(err.response?.data?.message || "Failed to apply OD");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] flex justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-[#111c2e] rounded-2xl p-10 shadow-xl text-slate-200">

        <h2 className="text-2xl font-semibold mb-8">
          Apply On-Duty (OD)
        </h2>

        {/* STUDENT */}
        <div className="mb-6">
          <label>Student <span className="text-red-500">*</span></label>
          <select
            value={form.studentId}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
            onChange={(e) =>
              setForm({ ...form, studentId: e.target.value })
            }
          >
            <option value="">Click to choose</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNo})
              </option>
            ))}
          </select>
        </div>

        {/* INDUSTRY */}
        <div className="mb-6">
          <label>Industry <span className="text-red-500">*</span></label>
          <select
            value={form.industry}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
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

        {/* CAMPUS TYPE */}
        <div className="mb-6">
          <label>Campus Type <span className="text-red-500">*</span></label>
          <select
            value={form.campusType}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
            onChange={(e) =>
              setForm({ ...form, campusType: e.target.value })
            }
          >
            <option value="">Click to choose</option>
            <option>On Campus</option>
            <option>Off Campus</option>
          </select>
        </div>

        {/* START DATE */}
        <div className="mb-6">
          <label>Start Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
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

        {/* END DATE */}
        <div className="mb-6">
          <label>End Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
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

        {/* DURATION */}
        <div className="mb-4">
          <label>Duration in days <span className="text-red-500">*</span></label>
          <input
            readOnly
            value={form.duration}
            className="w-full bg-[#0b1220] border border-slate-700 rounded-lg px-4 py-3"
          />
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* AIM FILE */}
        <div className="mb-6">
          <label>Aim & Objective <span className="text-red-500">*</span></label>
          <div className="border-2 border-dashed border-slate-600 p-6 rounded-lg text-center">
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
            <p className="text-slate-400 mt-2">
              {form.aimFile ? form.aimFile.name : "Drop file or click to choose"}
            </p>
          </div>

          <p className="text-red-500 text-sm mt-2">
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
          <p className="text-red-500 text-sm">
            * Please specify the Proof name only in the following format<br />
            <span className="ml-4">201CS111-ITI-08.06.2025</span>
          </p>
        </div>

        {/* OFFER FILE */}
        <div className="mb-8">
          <label>Offer Letter <span className="text-red-500">*</span></label>
          <div className="border-2 border-dashed border-slate-600 p-6 rounded-lg text-center">
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
            <p className="text-slate-400 mt-2">
              {form.offerFile ? form.offerFile.name : "Drop file or click to choose"}
            </p>
          </div>

          <p className="text-red-500 text-sm mt-2">
            * Please specify the Proof name only in the following format<br />
            <span className="ml-4">201CS111-ITO-08.06.2025</span>
          </p>
        </div>

        {/* IQAC VERIFICATION */}
        <div className="mb-8">
          <label className="block mb-2">
            IQAC Verification <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value="Initiated"
            disabled
            className="w-full bg-[#1f2937] border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
          />

          <p className="text-slate-400 text-sm mt-1">
            * IQAC status will be updated after document verification
          </p>
        </div>

        {/* BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg"
          >
            Create & Add Another
          </button>
        </div>

      </div>
    </div>
  );
}
