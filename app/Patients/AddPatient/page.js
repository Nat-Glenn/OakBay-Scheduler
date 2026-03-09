"use client";
import React, { useState } from "react";
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
  const [stat, setStat] = useState("");
  const [dob, setDob] = useState("");
  const status = [
    { id: 1, name: "Active" },
    { id: 2, name: "Inactive" },
  ];
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
              <form>
                <FieldGroup>
                  <FieldSet>
                    {/* NAME ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="First Name"
                        placeholder="First Name"
                        variant="add"
                      />
                      <FormField
                        fieldLabel="Last Name"
                        placeholder="Last Name"
                        variant="add"
                      />
                    </div>

                    {/* DATE OF BIRTH & AGE ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel className="font-bold" htmlFor="dateEdit">
                          Date
                        </FieldLabel>
                        <DatePicker date={dob} setDate={setDob} />
                      </Field>
                      <FormField
                        fieldLabel="Age"
                        placeholder="0"
                        variant="add"
                        mode="number"
                      />
                    </div>

                    {/* CONTACT INFORMATION ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        fieldLabel="Email"
                        placeholder="johndoe@gmail.com"
                        variant="add"
                        mode="email"
                      />
                      <FormField
                        fieldLabel="Phone Number"
                        placeholder="587-999-9999"
                        variant="add"
                        mode="tel"
                      />
                    </div>

                    {/* STATUS DROPDOWN */}
                    <FormField
                      fieldLabel="Address"
                      placeholder="123 Main St, Calgary, AB"
                      variant="add"
                    />

                    <FormField
                      fieldLabel="Status"
                      displayText={stat}
                      setItemSearch={setStat}
                      itemsArray={status}
                      variant="select"
                    />

                    {/* ADDRESS */}
                    <FormField
                      fieldLabel="Address"
                      placeholder="123 Main St, Calgary, AB"
                      variant="add"
                    />

                    {/* EMERGENCY CONTACT SECTION */}
                    <div className="pt-4 border-t">
                      <h3 className="font-bold mb-4">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          fieldLabel="Contact Name"
                          placeholder="Jane Doe"
                          variant="add"
                        />
                        <FormField
                          fieldLabel="Contact Phone"
                          placeholder="587-888-8888"
                          variant="add"
                          mode="tel"
                        />
                      </div>
                    </div>

                    {/* FORM ACTION BUTTONS */}
                    <div className="flex gap-4 pt-6">
                      <Link href="/PatientProfiles" className="flex-1">
                        <Button
                          type="button"
                          className=" bg-destructive hover:bg-destructive/60 w-full text-white font-bold"
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        className="flex-1 bg-button-primary hover:bg-button-primary-foreground text-white font-bold"
                      >
                        Create Patient
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
