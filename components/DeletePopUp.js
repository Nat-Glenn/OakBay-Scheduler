import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const deletePopUpVariants = cva("inline-flex cursor-pointer text-sm", {
  variants: {
    variant: {
      default:
        "bg-destructive rounded-md h-9 px-4 py-2 font-bold hover:bg-destructive/80 cursor-pointer",
      dropdown: "text-destructive font-semibold w-full",
    },
  },
});

function DeletePopUp({ handleDelete, object, variant = "default" }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger className={cn(deletePopUpVariants({ variant }))}>
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent className="flex flex-col">
        <AlertDialogTitle className="hidden">&nbsp;</AlertDialogTitle>
        <AlertDialogHeader>
          <div className="ml-auto mr-auto text-left gap-4 flex flex-col">
            <p className="text-2xl font-bold">
              Are you sure you want to delete this {object}?
            </p>
            <p className="text-base">This action cannot be undone.</p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex w-full gap-2 flex-col justify-center items-center-safe">
            <AlertDialogAction
              variant="destructive"
              className="w-full"
              onClick={async (e) => {
                const success = await handleDelete();
                if (!success) {
                  e.preventDefault();
                }
              }}
            >
              Delete
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { DeletePopUp, deletePopUpVariants };
