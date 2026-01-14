import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => setMe(res.data));
  }, []);

  if (!me) return null;

  if (!me.registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-700 text-white">
        <div className="bg-white/10 p-10 rounded-xl text-center">
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="mt-2">
            Your email is not registered in the OD system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-10">
      <div className="bg-white/10 p-8 rounded-xl max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p><b>Name:</b> {me.student.name}</p>
        <p><b>Roll No:</b> {me.student.rollNo}</p>
        <p><b>Department:</b> {me.student.department}</p>
        <p><b>Semester:</b> {me.student.semester}</p>
      </div>
    </div>
  );
}
