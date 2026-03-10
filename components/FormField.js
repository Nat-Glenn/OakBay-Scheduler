"use client";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { Check, ChevronDownIcon, Search, X } from "lucide-react";
import { Input } from "./ui/input";

export default function FormField({
  fieldLabel,
  displayText,
  search,
  setSearch,
  itemsArray = [],
  emptyText,
  setItemSearch,
  placeholder,
  mode,
  variant = "default",
  value,
  onChange,
  name,
}) {
  return (
    <Field>
      <FieldLabel className="font-bold">{fieldLabel}</FieldLabel>

      {variant == "default" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between truncate"
            >
              {displayText || `Select ${fieldLabel}`}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full h-50 p-2 scrollbar-rounded">
            {/* Search input */}
            <InputGroup className="border-border text-foreground placeholder:text-muted-foreground ">
              <InputGroupInput
                placeholder="Search by name..."
                className="focus-visible:ring-ring"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroupAddon>
                <Search size={18} />
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={() => setSearch("")}>
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            {/* Results */}
            {itemsArray.length === 0 ? (
              <div className="px-2 py-1 text-sm text-foreground">
                {emptyText}
              </div>
            ) : (
              itemsArray.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => {
                    setItemSearch(item.name);
                    setSearch(""); // reset search
                  }}
                  className="text-foreground"
                >
                  <Check
                    className={
                      displayText === item.name
                        ? "mr-2 text-foreground opacity-100"
                        : "mr-2 text-foreground opacity-0"
                    }
                  />
                  {item.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {variant === "add" && (
        <Input
          className="border-foreground shadow-xs outline-none"
          placeholder={placeholder}
          type={mode || "text"}
          min={mode === "number" ? 0 : undefined}
          max={mode === "number" ? 110 : undefined}
          value={value ?? ""}
          onChange={onChange}
          name={name}
        ></Input>
      )}

      {variant === "select" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between truncate"
            >
              {displayText || `Select ${fieldLabel}`}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full p-2 scrollbar-rounded">
            {/* Results */}
            {itemsArray.length === 0 ? (
              <div className="px-2 py-1 text-sm text-foreground">
                {emptyText}
              </div>
            ) : (
              itemsArray.map((item) => (
                <DropdownMenuItem
                  onSelect={() => {
                    setItemSearch(item.name);
                  }}
                  key={item.id}
                  className="text-foreground"
                >
                  <Check
                    className={
                      displayText === item.name
                        ? "mr-2 text-foreground opacity-100"
                        : "mr-2 text-foreground opacity-0"
                    }
                  />
                  {item.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Field>
  );
}
