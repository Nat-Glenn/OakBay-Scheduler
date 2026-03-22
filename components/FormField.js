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
import { useRef } from "react";
import { toast } from "sonner";

export default function FormField({
  fieldLabel,
  displayText,
  search,
  setSearch,
  itemsArray = [],
  emptyText,
  setItemSearch,
  placeholder,
  variant = "default",
  value,
  onChange,
  mode,
  name,
  mask,
  maxLength,
}) {
  const inputRef = useRef(null);
  function formatPhone(value) {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function formatCard(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);

    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;

    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
  }

  function formatEXP(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);

    if (digits.length <= 2) return digits;

    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }

  function formatAHC(value) {
    return value.replace(/\D/g, "").slice(0, 9);
  }

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
            <InputGroup className="border-foreground text-foreground placeholder:text-muted-foreground ">
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
          ref={inputRef}
          className="border-foreground shadow-xs outline-none"
          placeholder={placeholder}
          type={mode ? mode : "text"}
          inputMode={mask ? "numeric" : undefined}
          value={value ?? ""}
          name={name}
          maxLength={maxLength}
          onChange={(e) => {
            const input = e.target;
            const rawValue = input.value;
            const cursorPos = input.selectionStart;

            let formatted = rawValue;

            // Apply mask
            if (mask === "phone") formatted = formatPhone(rawValue);
            if (mask === "ahc") formatted = formatAHC(rawValue);
            if (mask === "card") formatted = formatCard(rawValue);
            if (mask === "exp") formatted = formatEXP(rawValue);
            const diff = formatted.length - rawValue.length;

            onChange({
              target: { name, value: formatted },
            });

            // Restore cursor
            if (mask) {
              requestAnimationFrame(() => {
                const newPos = cursorPos + diff;
                inputRef.current?.setSelectionRange(newPos, newPos);
              });
            }
          }}
        />
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
