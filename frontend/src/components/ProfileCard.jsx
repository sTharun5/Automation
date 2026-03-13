import {
  User,
  IdCard,
  Mail,
  Building2,
  Calendar,
  GraduationCap,
  Key,
  ShieldCheck,
  Award,
  Briefcase
} from "lucide-react";
import React from "react";

export default function ProfileCard({ student }) {
  if (!student) return null;

  const role = sessionStorage.getItem("role");

  const getFields = () => {
    switch (role) {
      case "STUDENT":
        return [
          { label: "Authorized Personnel", value: student.name, icon: <User /> },
          { label: "Vector ID", value: student.rollNum || student.rollNo, icon: <IdCard /> },
          { label: "Secure Uplink", value: student.email, icon: <Mail /> },
          { label: "Mission Sector", value: student.dept || student.department, icon: <Briefcase /> },
          { label: "Temporal Batch", value: student.batch || student.semester, icon: <Calendar /> },
          { label: "Protocol Standing", value: `${student.cgpa || "N/A"} CGPA`, icon: <Award /> },
        ];
      case "FACULTY":
        return [
          { label: "Command Personnel", value: student.name, icon: <User /> },
          { label: "Faculty ID", value: student.facultyId, icon: <IdCard /> },
          { label: "Secure Uplink", value: student.email, icon: <Mail /> },
          { label: "Control Sector", value: student.dept || student.department, icon: <Building2 /> },
        ];
      case "ADMIN":
        return [
          { label: "System Architect", value: student.name, icon: <User /> },
          { label: "Root Uplink", value: student.email, icon: <Mail /> },
          { label: "Authority Level", value: "Root Access", icon: <Key /> },
        ];
      default:
        return [];
    }
  };

  const fields = getFields().filter((f) => f.value != null && f.value !== "");

  return (
    <div className="relative p-8 sm:p-10 rounded-[3.5rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden group transition-all duration-500 hover:border-indigo-500/20">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-500/10 transition-colors animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="relative group/avatar">
          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 p-1 transform -rotate-3 group-hover/avatar:rotate-0 transition-transform duration-500 shadow-xl">
             <div className="w-full h-full rounded-[1.2rem] bg-white dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {student.name.charAt(0)}
                </span>
             </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg transform rotate-12">
             <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="space-y-4 w-full">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-full">
              {student.name}
            </h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
              Authorized Personnel · {student.rollNum || student.rollNo}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {fields.map(({ label, value, icon }, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group/badge hover:border-indigo-500/30 transition-all text-left">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover/badge:text-indigo-500 group-hover/badge:scale-110 transition-all shadow-sm">
                  {React.cloneElement(icon, { className: "w-5 h-5" })}
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-0.5">{label}</p>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {role === "STUDENT" && (
          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attendance Synchronicity</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">88%</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[88%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
