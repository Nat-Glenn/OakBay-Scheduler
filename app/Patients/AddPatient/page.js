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

/**
 * VALIDATION CONSTANTS
 * ---------------------------------------------------------
 */
const BLOCKED_WORDS = [
  "kill", "knife", "murder", "stab", "shoot", "gun",
  "suicide", "attack", "punch", "bomb", "threat"
];

// Helper to check for profanity or violent keywords
function containsBlockedContent(value) {
  const lower = value.toLowerCase();
  const hasViolence = BLOCKED_WORDS.some((word) => lower.includes(word));
  const hasProfanity = filter.check(lower);
  return hasViolence || hasProfanity;
}

export default function AddPatientPage() {
  const router = useRouter();

  /**
   * STATE MANAGEMENT
   * ---------------------------------------------------------
   */
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dob, setDob] = useState(""); // Managed separately for masking logic

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ahcNumber: "",
    notes: "",
  });

  /**
   * DATE HANDLING & MASKING
   * ---------------------------------------------------------
   */

  // Converts digits to MM/DD/YYYY format as the user types
  function applyDobMask(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let result = digits;
    if (digits.length > 4) result = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) result = digits.slice(0, 2) + "/" + digits.slice(2);
    return result;
  }

  // Converts the masked string to DB-friendly YYYY-MM-DD
  function dobToISO() {
    if (!dob || dob.length < 10) return null;
    const [mm, dd, yyyy] = dob.split("/");
    if (!mm || !dd || !yyyy || yyyy.length < 4) return null;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  /**
   * EVENT HANDLERS
   * ---------------------------------------------------------
   */

  function handleChange(e) {
    const { name, value } = e.target;

    // Real-time validation for Names
    if (name === "firstName" || name === "lastName") {
      if (containsBlockedContent(value)) {
        setError("Violence and Profanity is prohibited");
        return; // Block state update if it contains forbidden content
      } else {
        setError("");
      }
    }

    // Real-time validation for Notes (allows state update but shows error)
    if (name === "notes") {
      if (containsBlockedContent(value)) {
        setError("Notes contain inappropriate language.");
      } else {
        setError("");
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /**
   * FORM SUBMISSION
   * ---------------------------------------------------------
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 1. Required Field Validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim()
    ) {
      setError("First name, last name, and phone number are required.");
      return;
    }

    // 2. Content Safety Validation
    if (containsBlockedContent(formData.firstName)) {
      setError("First name contains inappropriate language.");
      return;
    }

    if (containsBlockedContent(formData.lastName)) {
      setError("Last name contains inappropriate language.");
      return;
    }

    if (formData.notes && containsBlockedContent(formData.notes)) {
      setError("Notes contain inappropriate language.");
      return;
    }

    // 3. Date Validation
    const isoDate = dobToISO();
    if (dob && !isoDate) {
      setError("Please enter a valid date of birth (MM/DD/YYYY).");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          ahcNumber: formData.ahcNumber.trim() || null,
          dob: isoDate,
          notes: formData.notes.trim() || null,
          reminderOptIn: true, // Defaulting to true for new registrations
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create patient");
      }

      // Success: Redirect back to the list and refresh the server data
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

      {/* Main container with custom scrollbar styling */}
      <div className="min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">

        {/* BREADCRUMB & TITLE */}
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

                    {/* PERSONAL DETAILS SECTION */}
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

                    {/* CONTACT DETAILS SECTION */}
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
                        mask="phone" // Built-in mask in FormField component
                      />
                    </div>

                    {/* IDENTIFICATION & BIRTH SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                      <FormField
                        fieldLabel="AHC Number"
                        placeholder="Optional"
                        variant="add"
                        name="ahcNumber"
                        value={formData.ahcNumber}
                        onChange={handleChange}
                        mask="ahc"
                      />

                      <Field className="flex flex-col gap-1">
                        <FieldLabel className="font-bold">Date of Birth</FieldLabel>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/DD/YYYY"
                          maxLength={10}
                          value={dob}
                          onChange={(e) => setDob(applyDobMask(e.target.value))}
                          className="h-10 w-full rounded-md border border-foreground bg-background dark:bg-input/30 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                        />
                      </Field>
                    </div>

                    {/* NOTES SECTION */}
                    <Field className="flex flex-col gap-2">
                      <FieldLabel className="font-bold">Notes</FieldLabel>
                      <textarea
                        className={`w-full min-h-24 rounded-md border px-3 py-2 text-sm bg-background dark:bg-input/30 transition-all ${
                          // Visual error feedback for notes validation
                          error.includes("inappropriate") && error.includes("Notes")
                            ? "border-red-500 ring-2 ring-red-500/20"
                            : "border-foreground"
                        }`}
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional notes"
                      />
                    </Field>

                    {/* ALERT AREA */}
                    {error && (
                      <p className="pt-4 text-sm text-red-500 font-bold uppercase italic">
                        {error}
                      </p>
                    )}

                    {/* FORM ACTIONS */}
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
                        disabled={submitting || !!error} // Prevents submission if API is busy or client validation fails
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