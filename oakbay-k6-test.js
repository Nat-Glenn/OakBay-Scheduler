import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "https://oakbay-scheduler-egfbged9dwdwh0dy.canadacentral-01.azurewebsites.net";

export const options = {
  scenarios: {
    baseline_mix: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "30s", target: 0 },
      ],
      exec: "baselineMix",
    },
    moderate_mix: {
      executor: "ramping-vus",
      startTime: "1m10s",
      stages: [
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "moderateMix",
    },
    patient_search_focus: {
      executor: "ramping-vus",
      startTime: "3m",
      stages: [
        { duration: "30s", target: 5 },
        { duration: "30s", target: 10 },
        { duration: "30s", target: 20 },
        { duration: "30s", target: 0 },
      ],
      exec: "patientSearchFocus",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
  },
};

const testDate = "2026-04-10";

export function baselineMix() {
  const urls = [
    `${BASE_URL}/api/practitioners`,
    `${BASE_URL}/api/appointments?date=${testDate}`,
    `${BASE_URL}/api/recall`,
    `${BASE_URL}/api/patients?search=test`,
  ];

  for (const url of urls) {
    const res = http.get(url);
    check(res, {
      "status is 200": (r) => r.status === 200,
    });
    sleep(1);
  }
}

export function moderateMix() {
  const urls = [
    `${BASE_URL}/api/practitioners`,
    `${BASE_URL}/api/appointments?date=${testDate}`,
    `${BASE_URL}/api/recall`,
    `${BASE_URL}/api/patients?search=test`,
  ];

  for (const url of urls) {
    const res = http.get(url);
    check(res, {
      "status is 200": (r) => r.status === 200,
    });
    sleep(1);
  }
}

export function patientSearchFocus() {
  const res = http.get(`${BASE_URL}/api/patients?search=test`);
  check(res, {
    "patient search status is 200": (r) => r.status === 200,
  });
  sleep(1);
}