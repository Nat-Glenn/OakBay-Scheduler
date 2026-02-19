import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ChevronDownIcon } from "lucide-react";
export default function PractitionerCard({ practitioner }) {
  return (
    <Card className="flex px-4 ">
      <Dialog>
        <form className="self-center">
          <DialogTrigger asChild>
            <Avatar className="size-20 hover:opacity-80 hover:cursor-pointer">
              <AvatarImage src="/favicon.png"></AvatarImage>
              <AvatarFallback>Profile Picture</AvatarFallback>
            </Avatar>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Practitioner</DialogTitle>
              <DialogDescription>
                Edit a Practitioner&apos;s information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field className="">
                <FieldLabel htmlFor="nameEdit">Name</FieldLabel>
                <Input
                  id="nameEdit"
                  type="text"
                  placeholder={practitioner.name}
                ></Input>
              </Field>
              <Field>
                <FieldLabel htmlFor="mailEdit">Email</FieldLabel>
                <Input
                  id="mailEdit"
                  type="text"
                  placeholder={practitioner.email}
                ></Input>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="phoneEdit">Phone Number</FieldLabel>
                <Input
                  id="phoneEdit"
                  type="number"
                  placeholder={practitioner.phone}
                ></Input>
              </Field>
              <Field>
                <FieldLabel htmlFor="hourEdit">Availability</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <ButtonGroup>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="justify-between flex"
                      >
                        Select time
                        <ChevronDownIcon />
                      </Button>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="justify-between flex"
                      >
                        Select time
                        <ChevronDownIcon />
                      </Button>
                    </ButtonGroup>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Command>
                      <CommandInput placeholder="Search time..." />

                      <CommandEmpty>No time found.</CommandEmpty>

                      <CommandGroup
                        className="w-full h-50"
                        id="hourEdit"
                      ></CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
            <DialogFooter>
              <DialogClose asChild variant="outline">
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                onClick={(e) => {
                  const success = handleEditPractitioner();
                  if (!success) e.preventDefault();
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
      <Item size="xs">
        <ItemContent>
          <ItemTitle>Name</ItemTitle>
          <ItemDescription>{practitioner.name}</ItemDescription>
        </ItemContent>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle>Email</ItemTitle>
          <ItemDescription>{practitioner.email}</ItemDescription>
        </ItemContent>
      </Item>
      <Item size="xs">
        <ItemContent>
          <ItemTitle>Phone Number</ItemTitle>
          <ItemDescription>{practitioner.phone}</ItemDescription>
        </ItemContent>
      </Item>
    </Card>
  );
}
