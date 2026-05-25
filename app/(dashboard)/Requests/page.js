/**
 * Reception queue for patient-submitted appointment requests from /book.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Inbox, RefreshCw } from "lucide-react";
import BookingRequestPatientKindBadge from "@/components/BookingRequestPatientKindBadge";
import PageHeader from "@/components/PageHeader";
import LoadErrorPanel from "@/components/LoadErrorPanel";
import EmptyState from "@/components/EmptyState";
import RequestReviewDialog from "@/components/RequestReviewDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/utils/apiFetch";
import { parseApiError } from "@/utils/parseApiError";

const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "DECLINED", label: "Declined" },
];

export default function RequestsPage() {
  const [status, setStatus] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/booking-requests?status=${status}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(parseApiError(data, "Failed to load requests"));
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, reloadKey]);

  return (      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        <PageHeader
          title="Appointment requests"
          description="Review patient requests from the public booking form."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          }
        />

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={status === tab.value ? "default" : "outline"}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {error ? (
          <LoadErrorPanel message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-border p-12 text-muted-foreground">
            Loading requests…
          </div>
        ) : requests.length === 0 && !error ? (
          <EmptyState
            icon={Inbox}
            title={`No ${status.toLowerCase()} requests`}
            description={
              status === "PENDING"
                ? "New patient requests from /book will appear here."
                : "Nothing in this tab yet."
            }
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="min-w-[160px]">Preferred times</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <p className="font-medium">
                        {req.firstName} {req.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.email}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <BookingRequestPatientKindBadge
                          patientKind={req.patientKind}
                        />
                        {req.patientId ? (
                          <Link
                            href={`/Patients?patientId=${req.patientId}`}
                            className="inline-flex items-center gap-0.5 text-xs font-medium text-[#2d5016] hover:underline"
                          >
                            Patient record
                            <ExternalLink className="size-3" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{req.type}</TableCell>
                    <TableCell className="min-w-[160px] max-w-[240px] align-top text-sm">
                      <ul className="space-y-1.5">
                        {req.preferences?.map((p) => (
                          <li key={p.id} className="leading-snug break-words">
                            {p.label}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(req.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {req.status === "PENDING" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSelected(req)}
                        >
                          Review
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelected(req)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selected ? (
          <RequestReviewDialog
            request={selected}
            open={Boolean(selected)}
            onOpenChange={(open) => !open && setSelected(null)}
            onComplete={() => {
              setSelected(null);
              setReloadKey((k) => k + 1);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("booking-requests-updated"));
              }
            }}
          />
        ) : null}
      </div>
  );
}
