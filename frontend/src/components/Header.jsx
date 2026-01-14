import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-8 py-5 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">SMART OD PORTAL</h1>
          <p className="text-blue-200 text-sm">
            Bannari Amman Institute of Technology
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
