"use client";
import { useState } from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { GrSearch } from "react-icons/gr";

const Patients = [
  { id: "P001", name: "John Doe", age: 42, email: "john.doe@email.com", lastVisit: "2024-05-12", status: "Active" },
  { id: "P002", name: "Jane Smith", age: 29, email: "jane.smith@email.com", lastVisit: "2024-05-15", status: "Active" },
  { id: "P003", name: "Robert Wilson", age: 55, email: "r.wilson@provider.net", lastVisit: "2023-11-20", status: "Inactive" },
  { id: "P004", name: "Sarah Jenkins", age: 34, email: "s.jenkins@email.com", lastVisit: "2024-06-01", status: "Active" },
  { id: "P005", name: "Michael Chen", age: 12, email: "m.chen@family.com", lastVisit: "2024-05-28", status: "Active" },
];

export default function PatientProfiles() {
  const [searchTerm, setSearchTerm] = useState("");

  // Search by name
  const filteredPatients = Patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.id.toLowerCase().includes(searchLower)
    );
  });

  return (
    <main className="flex min-h-screen w-full bg-gray-50">
      <NavBarComp />

      <div className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Patient Profiles</h1>
          <p className="text-gray-500">Manage and view all registered patients.</p>
        </header>

        <div className="flex flex-row items-center justify-between w-full mb-8">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <GrSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link href="/AddPatient">
            <button className="h-[42px] bg-[#00AEEF] text-white px-6 rounded-lg font-bold hover:bg-[#098cbc] transition-colors shadow-sm whitespace-nowrap">
              Add Patient
            </button>
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-left">
                <th className="p-4 font-semibold text-gray-700">ID</th>
                <th className="p-4 font-semibold text-gray-700">Name</th>
                <th className="p-4 font-semibold text-gray-700">Age</th>
                <th className="p-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                // determines color for the status
                let badgeStyle = "";
                if (patient.status === "Active") {
                  badgeStyle = "bg-green-100 text-green-700";
                } else {
                  badgeStyle = "bg-red-100 text-red-700";
                }

                return (
                  <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">{patient.id}</td>
                    <td className="p-4 font-medium text-gray-900">{patient.name}</td>
                    <td className="p-4 text-gray-600">{patient.age}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              
              {/* if the searched up name is not on the system shows no patients found */}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400">
                    No patients found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}