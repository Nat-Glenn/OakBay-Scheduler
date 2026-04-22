export const dailyOperationsReportSchema = {
  name: "daily_operations_report",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      reportDate: { type: "string" },
      summary: { type: "string" },
      metrics: {
        type: "object",
        additionalProperties: false,
        properties: {
          totalAppointments: { type: "number" },
          completed: { type: "number" },
          cancelled: { type: "number" },
          checkedIn: { type: "number" },
          requested: { type: "number" },
          confirmed: { type: "number" },
        },
        required: [
          "totalAppointments",
          "completed",
          "cancelled",
          "checkedIn",
          "requested",
          "confirmed",
        ],
      },
      practitionerBreakdown: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            practitionerName: { type: "string" },
            appointmentCount: { type: "number" },
          },
          required: ["practitionerName", "appointmentCount"],
        },
      },
      highlights: {
        type: "array",
        items: { type: "string" },
      },
      recommendedActions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "reportDate",
      "summary",
      "metrics",
      "practitionerBreakdown",
      "highlights",
      "recommendedActions",
    ],
  },
};

export const patientSummaryReportSchema = {
  name: "patient_summary_report",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      patientName: { type: "string" },
      summary: { type: "string" },
      contact: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: { type: "string" },
          phone: { type: "string" },
        },
        required: ["email", "phone"],
      },
      totals: {
        type: "object",
        additionalProperties: false,
        properties: {
          totalAppointments: { type: "number" },
          completed: { type: "number" },
          cancelled: { type: "number" },
        },
        required: ["totalAppointments", "completed", "cancelled"],
      },
      recentAppointments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: { type: "string" },
            type: { type: "string" },
            status: { type: "string" },
            providerName: { type: "string" },
            paymentAmount: {
              anyOf: [{ type: "number" }, { type: "null" }],
            },
            paymentMethod: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
          },
          required: [
            "date",
            "type",
            "status",
            "providerName",
            "paymentAmount",
            "paymentMethod",
          ],
        },
      },
      recommendedActions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "patientName",
      "summary",
      "contact",
      "totals",
      "recentAppointments",
      "recommendedActions",
    ],
  },
};