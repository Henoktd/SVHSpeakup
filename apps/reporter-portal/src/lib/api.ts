import type {
  CreateReportRequest,
  CreateReportResponse,
  SaveReporterEmailRequest
} from "@svh/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export async function createReport(
  payload: CreateReportRequest
): Promise<CreateReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to submit report.");
  }

  return response.json() as Promise<CreateReportResponse>;
}

export async function saveReporterEmail(
  payload: SaveReporterEmailRequest
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reports/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to save email.");
  }
}
