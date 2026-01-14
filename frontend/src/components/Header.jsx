import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const student = JSON.parse(localStorage.getItem("student"));

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/10 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">
            OD
          </div>
          <h1 className="text-white font-bold text-lg tracking-wide">
            SMART OD
          </h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">
              {student?.name}
            </p>
            <p className="text-blue-200 text-xs">
              {student?.rollNo}
            </p>
          </div>

          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold">
            {student?.name?.[0]}
          </div>

          <button
            onClick={logout}
            className="ml-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
