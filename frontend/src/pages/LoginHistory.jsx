import { useState, useEffect } from "react";
import api from "../api/axios";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  Search, 
  Filter, 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  User, 
  ChevronLeft,
  Loader2,
  ShieldCheck,
  UserCircle,
  GraduationCap,
  MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoginHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/login-history");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch login history", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN": return <ShieldCheck className="w-4 h-4 text-rose-500" />;
      case "FACULTY": return <UserCircle className="w-4 h-4 text-blue-500" />;
      case "STUDENT": return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      default: return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" /> Login History
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Audit logs of all user logins and device information.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 transition-all"
                />
              </div>
              
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <option value="ALL">All Roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-slate-500 animate-pulse">Fetching history...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No history found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                We couldn't find any login records matching your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider uppercase">
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Device & OS</th>
                    <th className="px-6 py-4">Browser</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.role === 'ADMIN' ? 'bg-rose-100 dark:bg-rose-900/30' : 
                            item.role === 'FACULTY' ? 'bg-blue-100 dark:bg-blue-900/30' : 
                            'bg-emerald-100 dark:bg-emerald-900/30'
                          }`}>
                            {getRoleIcon(item.role)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {item.email}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                              {item.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {item.location || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.deviceName === 'Desktop' ? <Monitor className="w-4 h-4 text-slate-400" /> : <Smartphone className="w-4 h-4 text-slate-400" />}
                          <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.deviceName}</p>
                            <p className="text-xs text-slate-500">{item.os || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.browser || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {item.ip || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {formatDate(item.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Audit Ref: #{item.id}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
