export default function ProfileCard({ student }) {
  if (!student) return null;

  const role = sessionStorage.getItem("role");

  const getFields = () => {
    switch (role) {
      case "STUDENT":
        return [
          { label: "Name", value: student.name, icon: "👤" },
          { label: "Roll No", value: student.rollNo, icon: "🆔" },
          { label: "Email", value: student.email, icon: "📧" },
          { label: "Department", value: student.department, icon: "🏢" },
          { label: "Semester", value: student.semester, icon: "📅" },
          { label: "Mentor", value: student.mentor?.name || "Not Assigned", icon: "👨‍🏫" },
        ];
      case "FACULTY":
        return [
          { label: "Name", value: student.name, icon: "👤" },
          { label: "Faculty ID", value: student.facultyId, icon: "🆔" },
          { label: "Email", value: student.email, icon: "📧" },
          { label: "Department", value: student.department, icon: "🏢" },
        ];
      case "ADMIN":
        return [
          { label: "Name", value: student.name, icon: "👤" },
          { label: "Email", value: student.email, icon: "📧" },
          { label: "Role", value: "Administrator", icon: "🔑" },
        ];
      default:
        return [];
    }
  };

  const fields = getFields().filter((f) => f.value != null && f.value !== "");

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01] animate-fadeIn">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
            👤
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
            {role?.toLowerCase()} Profile
          </h2>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          role === 'FACULTY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
          {role}
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {fields.map(({ label, value, icon }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-lg mt-0.5" aria-hidden="true">{icon}</span>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {value}
                </dd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
