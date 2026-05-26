/**
 * Centered load failure message with optional retry for list/table views.
 */

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoadErrorPanel({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 font-semibold"
          onClick={onRetry}
        >
          <RefreshCw size={14} aria-hidden />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
