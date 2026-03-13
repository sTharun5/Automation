import { ChevronRight } from "lucide-react";
import React from 'react';

export default function ActionCard({ title, description, buttonText, color = "blue", icon, onClick }) {
  const colors = {
    blue: "bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none",
    green: "bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none",
    purple: "bg-violet-600 text-white shadow-violet-200 dark:shadow-none",
    rose: "bg-rose-600 text-white shadow-rose-200 dark:shadow-none"
  };

  return (
    <button
      onClick={onClick}
      className={`relative w-full p-8 rounded-[3rem] ${colors[color] || colors.blue} group overflow-hidden active:scale-[0.98] transition-all duration-300 text-left h-full flex flex-col justify-between`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
      
      <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon ? (
            typeof icon === "string" ? <span className="text-2xl">{icon}</span> : React.cloneElement(icon, { className: "w-7 h-7" })
          ) : (
            <ChevronRight className="w-7 h-7" />
          )}
        </div>
        
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">{title}</h3>
          <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mt-2">{description || buttonText}</p>
        </div>

        <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all self-end">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}
