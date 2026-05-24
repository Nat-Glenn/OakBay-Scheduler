/**
 * Placeholder table rows while list data is loading.
 */

import { TableCell, TableRow } from "@/components/ui/table";

export default function TableListSkeleton({ rows = 6, cols = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={rowIndex} className="hover:bg-transparent">
      {Array.from({ length: cols }).map((__, colIndex) => (
        <TableCell key={colIndex} className="py-4">
          <div
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: colIndex === 0 ? "4rem" : "70%" }}
          />
        </TableCell>
      ))}
    </TableRow>
  ));
}
