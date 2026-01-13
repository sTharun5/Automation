import { useEffect, useState } from "react";
import api from "../api/axios";
import DateInput from "../components/DateInput";
import FileUpload from "../components/FileUpload";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [proofFile, setProof] = useState("");

  useEffect(() => {
    setStudent(JSON.parse(localStorage.getItem("student")));
  }, []);

  const submit = async () => {
    try {
      const res = await api.post("/od/create", {
        startDate,
        endDate,
        proofFile
      });
      alert("OD Approved: " + res.data.trackerId);
    } catch (e) {
      alert(e.response.data.message);
    }
  };

  if (!student) return null;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">Internship OD</h2>

      <div className="bg-gray-100 p-3 rounded mt-3">
        <p>{student.name}</p>
        <p>{student.rollNo}</p>
        <p>{student.email}</p>
      </div>

      <DateInput label="Start Date" onChange={setStart} />
      <DateInput label="End Date" onChange={setEnd} />
      <FileUpload onChange={setProof} />

      <button onClick={submit} className="w-full mt-4 bg-green-600 text-white p-2">
        Submit OD
      </button>
    </div>
  );
}
