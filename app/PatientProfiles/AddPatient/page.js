"use client";
import React from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { ChevronLeft } from "lucide-react";
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

export default function AddPatientPage() {
  return (
    <main className="flex h-dvh w-full overflow-hidden bg-background">
      <NavBarComp />

      <div className="flex-1 min-w-0 overflow-y-auto no-scrollbar pb-8">
        {/* HEADER SECTION */}
        <header className="pb-4 p-8">
          <div className="flex items-center gap-2 mb-2">
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
          <p className="text-muted-foreground">
            Enter patient information to create a profile.
          </p>
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
                      <Field>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          className="bg-input border border-border"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          required
                          className="bg-input border border-border"
                        />
                      </Field>
                    </div>

                    {/* DATE OF BIRTH & AGE ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                        <Input
                          id="dob"
                          type="date"
                          required
                          className="bg-input border border-border"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="age">Age</FieldLabel>
                        <Input
                          id="age"
                          type="number"
                          min="0"
                          max="150"
                          className="bg-input border border-border"
                          required
                        />
                      </Field>
                    </div>

                    {/* CONTACT INFORMATION ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="johndoe@gmail.com"
                          className="bg-input border border-border"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="587-999-9999"
                          className="bg-input border border-border"
                          required
                        />
                      </Field>
                    </div>

                    {/* STATUS DROPDOWN */}
                    <Field>
                      <FieldLabel htmlFor="status">Status</FieldLabel>
                      <Select defaultValue="Active">
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {/* ADDRESS */}
                    <Field>
                      <FieldLabel htmlFor="address">
                        Address (Optional)
                      </FieldLabel>
                      <Input
                        id="address"
                        placeholder="123 Main St, Calgary, AB"
                        className="bg-input border border-border"
                      />
                    </Field>

                    {/* EMERGENCY CONTACT SECTION */}
                    <div className="pt-4 border-t">
                      <h3 className="font-bold mb-4">Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel htmlFor="emergencyName">
                            Contact Name
                          </FieldLabel>
                          <Input
                            id="emergencyName"
                            placeholder="Jane Doe"
                            className="bg-input border border-border"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="emergencyPhone">
                            Contact Phone
                          </FieldLabel>
                          <Input
                            id="emergencyPhone"
                            type="tel"
                            placeholder="587-888-8888"
                            className="bg-input border border-border"
                          />
                        </Field>
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
