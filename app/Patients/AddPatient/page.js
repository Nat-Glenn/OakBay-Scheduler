"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import filter from "leo-profanity";
import NavBarComp from "@/components/NavBarComp";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import FormField from "@/components/FormField";

const BLOCKED_WORDS = [
  "kill", "knife", "murder", "stab", "shoot", "gun", "death", "die", 
  "hurt", "attack", "suicide", "harm", "hit", "punch", "bomb", "threat"
];

export default function AddPatientPage() {
  const router = useRouter();

  const [stat, setStat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const status = [
    { id: 1, name: "Active" },
    { id: 2, name: "Inactive" },
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ahcNumber: "",
    notes: "",
  });

  {/* FORM HANDLERS: CHANGE & SUBMIT */}
  function handleChange(e) {
    const { name, value } = e.target;

    // START UPDATED NOTES SECTION 
    if (name === "notes") {
      const lowerValue = value.toLowerCase();
      
      // Check for Violence/Threats OR Profanity
      const hasViolence = BLOCKED_WORDS.some(word => lowerValue.includes(word));
      const hasProfanity = filter.check(lowerValue);
      
      if (hasViolence || hasProfanity) {
        // BLOCK: Do not update state. The text won't appear in the box.
        setError("Violence and Profanity is prohibited");
        return; 
      } else {
        setError(""); 
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim()
    ) {
      setError("First name, last name, and phone number are required.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          ahcNumber: formData.ahcNumber.trim() || null,
          dob: null,
          notes: formData.notes.trim() || null,
          reminderOptIn: stat !== "Inactive",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create patient");
      }

      router.push("/Patients");
      router.refresh();
    } catch (err) {
      setError(err.message || "Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex h-dvh flex-col w-full bg-background text-foreground">
      <NavBarComp />

      <div className="min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
        
        {/* HEADER: BACK NAVIGATION & PAGE TITLE */}
        <header className="py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/Patients"
              className="flex items-center text-ring hover:text-ring/60 font-medium"
            >
              <ChevronLeft size={20} />
              Back to Profiles
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Register New Patient</h1>
        </header>

        <div className="flex justify-center">
          
          {/* PATIENT REGISTRATION CARD */}
          <Card className="w-full h-full max-w-2xl bg-dropdown border-foreground">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Patient Information
              </CardTitle>
              <CardDescription>
                Fill in the required patient details below.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <FieldSet>
                    
                    {/* NAME INPUTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="First Name"
                        placeholder="First Name"
                        variant="add"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        maxLength={30}
                      />
                      <FormField
                        fieldLabel="Last Name"
                        placeholder="Last Name"
                        variant="add"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        maxLength={30}
                      />
                    </div>

                    {/* CONTACT INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="Email"
                        placeholder="johndoe@gmail.com"
                        variant="add"
                        mode="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        maxLength={254}
                      />
                      <FormField
                        fieldLabel="Phone Number"
                        placeholder="587-999-9999"
                        variant="add"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        mask="phone"
                      />
                    </div>

                    {/* HEALTH CARD & STATUS SELECT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="AHC Number"
                        placeholder="Optional"
                        variant="add"
                        name="ahcNumber"
                        value={formData.ahcNumber}
                        onChange={handleChange}
                        mask="ahc"
                      />

                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          fieldLabel="Status"
                          displayText={stat}
                          setItemSearch={setStat}
                          itemsArray={status}
                          variant="select"
                        />
                      </div>
                    </div>

                    <Field className="flex flex-col gap-2">
                      <FieldLabel className="font-bold">Notes</FieldLabel>
                      <textarea
                        className={`w-full min-h-24 rounded-md border px-3 py-2 text-sm bg-background dark:bg-input/30 transition-all ${
                          error.includes("Blocked") ? "border-red-500 ring-2 ring-red-500/20" : "border-foreground"
                        }`}
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional notes"
                      />
                    </Field>

                    {/* ERROR MESSAGE DISPLAY */}
                    {error && (
                      <p className="pt-4 text-sm text-red-500 font-bold uppercase italic">
                        {error}
                      </p>
                    )}

                    {/* CANCEL & CREATE */}
                    <div className="flex gap-4 pt-6">
                      <Link href="/Patients" className="flex-1">
                        <Button
                          type="button"
                          className="bg-destructive hover:bg-destructive/60 w-full text-white font-bold"
                        >
                          Cancel
                        </Button>
                      </Link>

                      <Button
                        type="submit"
                        disabled={submitting || !!error}
                        className="flex-1 bg-button-primary hover:bg-button-primary-foreground text-white font-bold"
                      >
                        {submitting ? "Creating..." : "Create Patient"}
                      </Button>
                    </div>

                  </FieldSet>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}