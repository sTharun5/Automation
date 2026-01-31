export default function ProfileCard({ student }) {
  if (!student) return null;

  const fields = [
    { label: "Name", value: student.name },
    { label: "Roll No", value: student.rollNo },
    { label: "Email", value: student.email },
    { label: "Department", value: student.department },
    { label: "Semester", value: student.semester },
  ].filter((f) => f.value != null && f.value !== "");

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden transition-colors">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
          👤
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Student Profile
        </h2>
      </div>

      <div className="p-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
