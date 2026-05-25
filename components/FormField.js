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
import { formatNorthAmericanPhone } from "@/lib/formatting/phone";

function PractitionerDropdownOption({ item, displayText, setItemSearch, setSearch }) {
  const handleSelect = (event) => {
    if (item.disabled) {
      event.preventDefault();
      if (item.booked) {
        toast.warning(
          "This chiropractor already has an appointment at this time.",
          { position: "top-right" },
        );
      } else {
        toast.warning("This chiropractor is not on shift for the selected time.", {
          position: "top-right",
        });
      }
      return;
    }
    setItemSearch(item.name);
    if (setSearch) setSearch("");
  };

  return (
    <DropdownMenuItem
      key={item.id}
      disabled={item.disabled}
      onSelect={handleSelect}
      className={`flex items-start gap-2 py-2 ${
        item.disabled
          ? "cursor-not-allowed opacity-60"
          : "text-foreground"
      }`}
    >
      <Check
        className={
          displayText === item.name
            ? "mt-0.5 shrink-0 text-foreground opacity-100"
            : "mt-0.5 shrink-0 text-foreground opacity-0"
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {item.name}
          {item.booked ? (
            <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Booked
            </span>
          ) : null}
          {!item.booked && item.onShift === true ? (
            <span className="rounded-md bg-status-checked-in/35 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-checked-in-foreground">
              On shift
            </span>
          ) : null}
          {!item.booked && item.onShift === false ? (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Off
            </span>
          ) : null}
        </span>
        {item.meta ? (
          <span className="text-xs leading-snug text-muted-foreground">
            {item.meta}
          </span>
        ) : null}
      </div>
    </DropdownMenuItem>
  );
}

function renderDropdownOptions(itemsArray, displayText, setItemSearch, setSearch) {
  const hasShiftMeta = itemsArray.some(
    (item) => item.onShift !== undefined || item.booked,
  );

  return itemsArray.map((item) =>
    hasShiftMeta ? (
      <PractitionerDropdownOption
        key={item.id}
        item={item}
        displayText={displayText}
        setItemSearch={setItemSearch}
        setSearch={setSearch}
      />
    ) : (
      <DropdownMenuItem
        key={item.id}
        onSelect={() => {
          setItemSearch(item.name);
          if (setSearch) setSearch("");
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
    ),
  );
}

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
              renderDropdownOptions(
                itemsArray,
                displayText,
                setItemSearch,
                setSearch,
              )
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
            if (mask === "phone") formatted = formatNorthAmericanPhone(rawValue);
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
              renderDropdownOptions(itemsArray, displayText, setItemSearch)
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Field>
  );
}
