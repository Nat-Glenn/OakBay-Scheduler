"use client";
import React from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";

export default function AddPatientPage() {
  return (
    <main className="flex min-h-dvh w-full bg-gray-50">
      <NavBarComp />

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        
        <div className="w-full max-w-2xl">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Add New Patient</h1>
              <p className="text-gray-500">Register a new patient in the system.</p>
            </div>
            <Link href="/PatientProfiles" className="text-[#00AEEF] hover:underline font-medium pb-1">
              ← Back to Profiles
            </Link>
          </header>

          <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <form className="space-y-6">
              
              {/* Name Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <input 
                    type="text" 
                    placeholder="First Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Last Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Age Input field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age</label>
                <input 
                  type="number" 
                  placeholder="Age"
                  min="0"
                  max="200"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all"
                  required
                />
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00AEEF] outline-none transition-all bg-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#00AEEF] text-white py-3 rounded-lg font-bold hover:bg-[#098cbc] transition-colors shadow-sm"
              >
                Confirm Registration
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}