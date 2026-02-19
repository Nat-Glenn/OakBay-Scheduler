"use client";
import NavBarComp from "@/components/NavBarComp";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { Check, ChevronDownIcon, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import PractitionerCard from "@/components/PractitionerCard";

import { useState } from "react";

export default function Practitioners() {
  const practitioners = [
    {
      id: 1,
      name: "Brad Pritchard",
      email: "bradpritchard@gmail.com",
      phone: "5933493018",
    },
    {
      id: 2,
      name: "Kyle James",
      email: "kylejames@gmail.com",
      phone: "5943443618",
    },
    {
      id: 3,
      name: "Daniel Topala",
      email: "danieltopala@gmail.com",
      phone: "5543453678",
    },
    {
      id: 4,
      name: "Francis Morris",
      email: "francismorris@gmail.com",
      phone: "5521690678",
    },
    {
      id: 5,
      name: "Yui Hirasawa",
      email: "yuihirasawa@gmail.com",
      phone: "5523670708",
    },
  ];
  const [practitioner, setPractitioner] = useState(null);

  const clear = () => {
    setPractitioner(null);
  };
  return (
    <main className="flex min-h-dvh w-full">
      <NavBarComp />
      <div className="flex-2 px-4 pt-4 overflow-y-hidden">
        <header className="pb-4 px-4">
          <h1 className="text-3xl font-bold text-gray-800">Practitioners</h1>
          <p className="text-gray-500">
            Manage and view all current practitioners.
          </p>
        </header>
        <div className="w-1/4 p-4">
          <Field>
            <FieldLabel>Practitioner</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <ButtonGroup>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {practitioner ? practitioner.name : "Select Practitioner"}
                    {!practitioner && <ChevronDownIcon />}
                  </Button>
                  {practitioner && (
                    <Button variant="outline" onClick={clear}>
                      <X />
                    </Button>
                  )}
                </ButtonGroup>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search Practitioner..." />
                  <CommandEmpty>No practitioner found.</CommandEmpty>
                  <CommandGroup>
                    {practitioners.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={p.name}
                        onSelect={() => {
                          setPractitioner(p);
                        }}
                      >
                        <Check
                          className={
                            practitioner?.name === p.name
                              ? "opacity-100"
                              : "opacity-0"
                          }
                        />
                        {p.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </Field>
        </div>
        <div className="md:h-98 grid grid-cols-4 gap-4 overflow-y-scroll px-4">
          {practitioner ? (
            <PractitionerCard practitioner={practitioner} />
          ) : (
            practitioners.map((p) => (
              <PractitionerCard key={p.id} practitioner={p} />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
