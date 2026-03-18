"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
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

export default function AddPatientPage() {
  const router = useRouter();

  const [stat, setStat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dob, setDob] = useState({
    year: "",
    month: "",
    day: "",
  });
  const status = [
    { id: 1, name: "Active" },
    { id: 2, name: "Inactive" },
  ];

  function getYearsRange() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let y = currentYear; y >= 1900; y--) {
      years.push(y);
    }

    return years;
  }
  function getMonthsRange() {
    let months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i);
    }
    return months;
  }
  const getDaysInMonth = (year, month) => {
    if (!year || !month) return [];

    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    ahcNumber: "",
    dob: "",
    notes: "",
  });

  function updateDOB(field, value) {
    setDob((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "month" || field === "year" ? { day: "" } : {}),
    }));
  }
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const formattedDOB =
    dob.year && dob.month && dob.day
      ? `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(
        dob.day,
      ).padStart(2, "0")}`
      : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation check
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim() ||
      !formattedDOB
    ) {
      setError(
        "First name, last name, phone number, and date of birth are required.",
      );
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
          dob: formattedDOB,
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

                      <div className="grid grid-cols-1 md:grid-cols- gap-4">
                        <FormField
                          fieldLabel="Status"
                          displayText={stat}
                          setItemSearch={setStat}
                          itemsArray={status}
                          variant="select"
                        />
                      </div>

                      {/* <FieldGroup>
                        <div className="grid grid-cols-3 gap-2">
                          <Field>
                            <FieldLabel>Year</FieldLabel>
                            <Select
                              onValueChange={(value) =>
                                updateDOB("year", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {getYearsRange().map((year) => (
                                  <SelectItem
                                    key={year}
                                    value={year.toString()}
                                  >
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel>Month</FieldLabel>
                            <Select
                              onValueChange={(value) =>
                                updateDOB("month", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {getMonthsRange().map((month) => (
                                  <SelectItem
                                    key={month}
                                    value={month.toString()}
                                  >
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field>
                            <FieldLabel>Day</FieldLabel>
                            <Select
                              onValueChange={(value) => updateDOB("day", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent>
                                {getDaysInMonth(dob.year, dob.month).map(
                                  (day) => (
                                    <SelectItem
                                      key={day}
                                      value={day.toString()}
                                    >
                                      {day}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                      </FieldGroup> */}
                    </div>

                    <Field className="flex flex-col gap-2">
                      <FieldLabel className="font-bold">Notes</FieldLabel>
                      <textarea
                        className="w-full min-h-24 rounded-md border border-foreground px-3 py-2 text-sm bg-background dark:bg-input/30"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Optional notes"
                      />
                    </Field>

                    {error && (
                      <p className="pt-4 text-sm text-red-500 font-medium">
                        {error}
                      </p>
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
