import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";
import ProfileCard from "../components/ProfileCard";
import ActionCard from "../components/ActionCard";

export default function Dashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const student = JSON.parse(localStorage.getItem("student"));

  useEffect(() => {
    if (!token || !student) {
      navigate("/", { replace: true });
    }
  }, [navigate, token, student]);

  if (!token || !student) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 p-8 space-y-8">
        <ProfileCard student={student} />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Apply OD"
            description="Apply for Internship / Internal OD"
            color="blue"
            buttonText="Apply Now"
          />

          <ActionCard
            title="OD Status"
            description="Track approval status"
            color="green"
            buttonText="View Status"
          />

          <ActionCard
            title="History"
            description="View previous OD records"
            color="purple"
            buttonText="View History"
          />
        </section>

        <section className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            System Rules
          </h3>
          <ul className="list-disc pl-6 text-gray-600 text-sm space-y-1">
            <li>OD allowed only for placed students</li>
            <li>Maximum OD duration: 60 days</li>
            <li>OTP based secure login</li>
            <li>All actions are logged</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}
