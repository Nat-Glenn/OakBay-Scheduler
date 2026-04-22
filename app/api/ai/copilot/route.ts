import { client } from "@/lib/ai/client";
import {
  getOverdueAppointments,
  getPatientSummary,
  getPractitionerDailySummary,
  getDailyOperationsReportData,
  getOperationsReportByRange,
} from "@/lib/ai/tools";
import {
  dailyOperationsReportSchema,
  patientSummaryReportSchema,
} from "@/lib/ai/reportSchemas";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type ToolCallArgs = Record<string, unknown>;

async function runTool(name: string, args: ToolCallArgs) {
  switch (name) {
    case "get_overdue_appointments":
      return await getOverdueAppointments();

    case "get_operations_report_by_range": {
      const range = typeof args.range === "string" ? args.range : "daily";
      return await getOperationsReportByRange(range);
    }

    case "get_patient_summary": {
      const patientName =
        typeof args.patientName === "string" ? args.patientName : "";
      return await getPatientSummary(patientName);
    }

    case "get_practitioner_daily_summary": {
      const practitionerName =
        typeof args.practitionerName === "string" ? args.practitionerName : "";
      return await getPractitionerDailySummary(practitionerName);
    }

    case "get_daily_operations_report_data":
      return await getDailyOperationsReportData();

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function extractPatientName(prompt: string) {
  const cleaned = prompt.trim();

  const patterns = [
    /(?:for|of)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /summarize\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)'s\s+appointment history/i,
    /summarize\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)'s\s+patient history/i,
    /patient report for\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /patient summary for\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /report for\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
    /summary for\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  if (/^[a-zA-Z]+(?:\s+[a-zA-Z]+)?$/.test(cleaned)) {
    return cleaned;
  }

  return "";
}

function detectIntent(prompt: string) {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("overdue") ||
    lower.includes("missed appointments") ||
    lower.includes("no-show") ||
    lower.includes("missed appointment")
  ) {
    return {
      tool: "get_overdue_appointments",
      args: {},
    };
  }

  if (
    lower.includes("monthly report") ||
    lower.includes("monthly summary") ||
    lower.includes("this month")
  ) {
    return {
      tool: "get_operations_report_by_range",
      args: { range: "monthly" },
    };
  }

  if (
    lower.includes("yearly report") ||
    lower.includes("annual report") ||
    lower.includes("yearly summary") ||
    lower.includes("this year")
  ) {
    return {
      tool: "get_operations_report_by_range",
      args: { range: "yearly" },
    };
  }

  if (
    lower.includes("patient history") ||
    lower.includes("appointment history") ||
    lower.includes("patient summary") ||
    lower.includes("summarize patient") ||
    (lower.includes("summarize") && lower.includes("appointment"))
  ) {
    return {
      tool: "get_patient_summary",
      args: {
        patientName: extractPatientName(prompt),
      },
    };
  }

  if (
    lower.includes("practitioner summary") ||
    lower.includes("today by practitioner") ||
    lower.includes("daily summary by practitioner")
  ) {
    return {
      tool: "get_practitioner_daily_summary",
      args: {},
    };
  }

  if (
    lower.includes("operations summary") ||
    lower.includes("clinic activity") ||
    lower.includes("daily operations") ||
    lower.includes("today's summary") ||
    lower.includes("todays summary") ||
    lower.includes("daily report")
  ) {
    return {
      tool: "get_daily_operations_report_data",
      args: {},
    };
  }

  return null;
}

async function handleChat(prompt: string) {
  const route = detectIntent(prompt);

  if (!route) {
    const fallback = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        {
          role: "system",
          content: `
You are Clinic Copilot, an internal AI assistant for chiropractic clinic staff.

Rules:
- Be concise, accurate, and operational.
- If the question needs clinic data and no tool was selected, say that the request could not be matched to a supported clinic-data action yet.
- Do not invent patient, appointment, billing, or practitioner details.
- Do not provide diagnosis, treatment advice, or clinical recommendations.
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    return fallback.choices[0]?.message?.content || "";
  }

  const toolResult = await runTool(route.tool, route.args);

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
You are Clinic Copilot, an internal AI assistant for chiropractic clinic staff.

Rules:
- Answer using only the provided tool result.
- Be concise, accurate, and operational.
- If the tool result is empty or says nothing was found, clearly say so.
- Do not invent patient, appointment, billing, or practitioner details.
- Do not provide diagnosis, treatment advice, or clinical recommendations.
      `.trim(),
    },
    {
      role: "user",
      content: prompt,
    },
    {
      role: "assistant",
      content: `Tool selected: ${route.tool}`,
    },
    {
      role: "user",
      content: `Tool result:\n${JSON.stringify(toolResult)}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages,
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || "";
}

async function handleDailyReport() {
  const reportData = await getDailyOperationsReportData();

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      {
        role: "system",
        content: `
You generate structured internal clinic operations reports.
Use only the provided clinic data.
Do not invent data.
Return a clean operational report.
        `.trim(),
      },
      {
        role: "user",
        content: `Generate a daily clinic operations report from this data:\n${JSON.stringify(
          reportData
        )}`,
      },
    ],
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: dailyOperationsReportSchema,
    },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function handleRangeReport(range: string) {
  const reportData = await getOperationsReportByRange(range);

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      {
        role: "system",
        content: `
You generate structured internal clinic operations reports.
Use only the provided clinic data.
Do not invent data.
Return a clean operational report.
        `.trim(),
      },
      {
        role: "user",
        content: `Generate a ${range} clinic operations report from this data:\n${JSON.stringify(
          reportData
        )}`,
      },
    ],
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: dailyOperationsReportSchema,
    },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

async function handlePatientReport(prompt: string) {
  const patientName = extractPatientName(prompt);
  const reportData = await getPatientSummary(patientName);

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      {
        role: "system",
        content: `
You generate structured internal patient summary reports for clinic staff.
Use only the provided patient data.
Do not invent data.
If no patient is found, reflect that clearly in the summary and recommended actions.
        `.trim(),
      },
      {
        role: "user",
        content: `Generate a patient summary report from this data:\n${JSON.stringify(
          reportData
        )}`,
      },
    ],
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: patientSummaryReportSchema,
    },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

export async function POST(req: Request) {
  try {
    const { prompt, mode, range } = await req.json();

    if (!mode || typeof mode !== "string") {
      return Response.json({ error: "Mode is required" }, { status: 400 });
    }

    if (
      mode !== "daily_report" &&
      mode !== "range_report" &&
      (!prompt || typeof prompt !== "string")
    ) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (mode === "chat") {
      const reply = await handleChat(prompt);
      return Response.json({ reply });
    }

    if (mode === "daily_report") {
      const report = await handleDailyReport();
      return Response.json({ report });
    }

    if (mode === "range_report") {
      const selectedRange = typeof range === "string" ? range : "monthly";
      const report = await handleRangeReport(selectedRange);
      return Response.json({ report });
    }

    if (mode === "patient_report") {
      const report = await handlePatientReport(prompt);
      return Response.json({ report });
    }

    return Response.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("AI ERROR:", err);
    return Response.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}