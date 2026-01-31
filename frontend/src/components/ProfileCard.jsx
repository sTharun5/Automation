export default function ProfileCard({ student }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        Student Profile
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-slate-300">
        <p><b>Name:</b> {student.name}</p>
        <p><b>Roll No:</b> {student.rollNo}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Department:</b> {student.department}</p>
        <p><b>Semester:</b> {student.semester}</p>
      </div>
    </section>
  );
}
