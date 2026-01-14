export default function ProfileCard({ student }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-white shadow-lg">
      <h3 className="font-semibold text-lg mb-4">Profile</h3>

      <div className="space-y-2 text-sm">
        <p><span className="text-blue-200">Name:</span> {student.name}</p>
        <p><span className="text-blue-200">Roll No:</span> {student.rollNo}</p>
        <p><span className="text-blue-200">Email:</span> {student.email}</p>
        <p><span className="text-blue-200">Department:</span> {student.department}</p>
        <p><span className="text-blue-200">Semester:</span> {student.semester}</p>
      </div>
    </div>
  );
}
