/**
 * Loading skeleton for the Summary dashboard (stats + visits table).
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";

function StatSkeleton() {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="space-y-3 p-6">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted/70" />
      </CardContent>
    </Card>
  );
}

export default function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="px-8 py-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3 px-8 pb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded bg-muted/50"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
