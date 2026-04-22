"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ClinicCopilot() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatReply, setChatReply] = useState("");
  const [report, setReport] = useState(null);
  const [mode, setMode] = useState("chat");

  async function handleSubmit(selectedMode) {
    setLoading(true);
    setMode(selectedMode);
    setChatReply("");
    setReport(null);

    try {
      const body =
        selectedMode === "daily_report"
          ? { mode: "daily_report" }
          : { mode: selectedMode, prompt };

      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (selectedMode === "chat") {
        setChatReply(data.reply || "");
      } else {
        setReport(data.report || null);
      }
    } catch (err) {
      setChatReply(err.message || "Failed to get AI response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-dropdown border-foreground text-foreground">
      <CardHeader>
        <h2 className="text-xl font-bold">Clinic Copilot</h2>
        <p className="text-sm text-muted-foreground">
          Ask staff questions or generate clinic reports.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Input
          placeholder="Ask about appointments, patients, or reports..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-input border-foreground"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleSubmit("chat")}
            className="bg-button-primary text-white"
            disabled={loading || !prompt.trim()}
          >
            Ask Copilot
          </Button>

          <Button
            onClick={() => handleSubmit("daily_report")}
            variant="secondary"
            disabled={loading}
          >
            Daily Report
          </Button>

          <Button
            onClick={() => handleSubmit("patient_report")}
            variant="secondary"
            disabled={loading || !prompt.trim()}
          >
            Patient Report
          </Button>
        </div>

        {loading && (
          <div className="text-sm text-muted-foreground">Generating response...</div>
        )}

        {chatReply && mode === "chat" && (
          <div className="rounded-lg border border-foreground/30 p-4 bg-input whitespace-pre-wrap text-sm">
            {chatReply}
          </div>
        )}

        {report && (
          <div className="rounded-lg border border-foreground/30 p-4 bg-input space-y-4 text-sm">
            <div>
              <h3 className="font-bold text-base">
                {report.title || "Generated Report"}
              </h3>
            </div>

            {"summary" in report && (
              <div>
                <p className="font-semibold">Summary</p>
                <p>{report.summary}</p>
              </div>
            )}

            {"metrics" in report && (
              <div>
                <p className="font-semibold">Metrics</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(report.metrics, null, 2)}
                </pre>
              </div>
            )}

            {"totals" in report && (
              <div>
                <p className="font-semibold">Totals</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(report.totals, null, 2)}
                </pre>
              </div>
            )}

            {"practitionerBreakdown" in report && (
              <div>
                <p className="font-semibold">Practitioner Breakdown</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(report.practitionerBreakdown, null, 2)}
                </pre>
              </div>
            )}

            {"recentAppointments" in report && (
              <div>
                <p className="font-semibold">Recent Appointments</p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(report.recentAppointments, null, 2)}
                </pre>
              </div>
            )}

            {"recommendedActions" in report && (
              <div>
                <p className="font-semibold">Recommended Actions</p>
                <ul className="list-disc pl-5">
                  {report.recommendedActions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}