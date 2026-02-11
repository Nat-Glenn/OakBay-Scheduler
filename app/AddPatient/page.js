"use client";
import React from "react";
import Link from "next/link";
import NavBarComp from "@/components/NavBarComp";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
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
    <main className="flex min-h-dvh w-full">
      <NavBarComp />
      <div className="flex-1 p-4">
        <header className="pb-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/PatientProfiles"
              className="flex items-center text-[#002D58] hover:text-[#002D58]/60 font-medium"
            >
              <ChevronLeft size={20} />
              Back to Profiles
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Register New Patient
          </h1>
          <p className="text-gray-500">
            Enter patient information to create a profile.
          </p>
        </header>

        <div className="flex justify-center px-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <h2 className="text-xl font-bold">Patient Information</h2>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                  <FieldSet>
                    <FieldDescription>
                      Fill in the required patient details below.
                    </FieldDescription>

                    {/* Name Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="firstName">
                          First Name
                        </FieldLabel>
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          required
                        />
                      </Field>
                    </div>

                    {/* Date of Birth */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                        <Input id="dob" type="date" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="age">Age</FieldLabel>
                        <Input
                          id="age"
                          type="number"
                          min="0"
                          max="150"
                          required
                        />
                      </Field>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="johndoe@gmail.com"
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="587-999-9999"
                          required
                        />
                      </Field>
                    </div>

                    {/* Status */}
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

                    {/* Address */}
                    <Field>
                      <FieldLabel htmlFor="address">
                        Address (Optional)
                      </FieldLabel>
                      <Input
                        id="address"
                        placeholder="123 Main St, Calgary, AB"
                      />
                    </Field>

                    {/* Emergency Contact */}
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
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <Link href="/PatientProfiles" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full font-semibold"
                        >
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        className="flex-1 bg-[#A0CE66] hover:bg-[#A0CE66]/60 hover:text-black/60 text-white font-bold"
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