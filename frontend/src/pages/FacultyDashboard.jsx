import { useNavigate } from "react-router-dom";
export default function FacultyDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Faculty Dashboard</h1>

      <div className="bg-[#111c2e] p-6 rounded-xl shadow max-w-3xl">
        <p className="text-lg">
          Welcome, <span className="font-semibold">{user?.name}</span>
        </p>

        <p className="text-slate-400 mt-1">
          Email: {user?.email}
        </p>

        <p className="text-slate-400 mt-1">
          Department: {user?.department || "—"}
        </p>

        <div className="mt-8 space-y-4">
          <div
  onClick={() => navigate("/faculty/update-placement")}
  className="bg-[#0b1220] p-4 rounded-lg border border-slate-700 cursor-pointer hover:bg-[#16213a]"
>
  📋 Update Student Placement Status
</div>


          <div className="bg-[#0b1220] p-4 rounded-lg border border-slate-700">
            🔍 View Students (next)
          </div>
        </div>
      </div>
    </div>
  );
}
