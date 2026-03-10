"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { ChevronDownIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import DatePicker from "@/components/DatePicker";
import FormField from "@/components/FormField";

export default function AddPatientPage() {
  const router = useRouter();

  const [stat, setStat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dob, setDob] = useState("");
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

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
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
    <main className="flex h-dvh flex-col w-full overflow-hidden bg-background">
      <NavBarComp />

      <div className="min-w-0 overflow-y-auto scrollbar-rounded px-4 pb-4">
        {/* HEADER SECTION */}
        <header className="py-4">
          <div className="flex items-center gap-4">
            {/* BACK BUTTON */}
            <Link
              href="/PatientProfiles"
              className="flex items-center text-ring hover:text-ring/60 font-medium"
            >
              <ChevronLeft size={20} />
              Back to Profiles
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Register New Patient
          </h1>
        </header>

        {/* FORM CONTAINER */}
        <div className="flex justify-center">
          <Card className="w-full h-full max-w-2xl">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="First Name"
                        placeholder="First Name"
                        variant="add"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                      <FormField
                        fieldLabel="Last Name"
                        placeholder="Last Name"
                        variant="add"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="Email"
                        placeholder="johndoe@gmail.com"
                        variant="add"
                        mode="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <FormField
                        fieldLabel="Phone Number"
                        placeholder="587-999-9999"
                        variant="add"
                        mode="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="AHC Number"
                        placeholder="Optional"
                        variant="add"
                        name="ahcNumber"
                        value={formData.ahcNumber}
                        onChange={handleChange}
                      />
                      <FormField
                        fieldLabel="Status"
                        displayText={stat}
                        setItemSearch={setStat}
                        itemsArray={status}
                        variant="select"
                      />
                    </div>

                    <Field>
                      <FieldLabel className="font-bold">Notes</FieldLabel>
                      <textarea
                        className="w-full min-h-24 rounded-md border border-foreground px-3 py-2 text-sm bg-background"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional notes"
                      />
                    </Field>

                    {error && (
                      <p className="pt-4 text-sm text-red-500">{error}</p>
                    )}

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
                        disabled={submitting}
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
