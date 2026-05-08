import type {
  ReporterAccessRequest,
  ReporterCaseAccessResponse,
  CreateReportRequest,
  CreateReportResponse,
  ReporterFormOptionsResponse,
  SaveReporterEmailRequest,
  SaveReporterEmailResponse
} from "@svh/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export async function createReport(
  payload: CreateReportRequest,
  evidenceFiles: File[] = []
): Promise<CreateReportResponse> {
  if (evidenceFiles.length > 0) {
    const formData = new FormData();

    formData.append("payload", JSON.stringify(payload));

    for (const file of evidenceFiles) {
      formData.append("evidenceFiles", file);
    }

    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Unable to submit report.");
    }

    return response.json() as Promise<CreateReportResponse>;
  }

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

export async function getReporterFormOptions(): Promise<ReporterFormOptionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/reports/options`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load report form options.");
  }

  return response.json() as Promise<ReporterFormOptionsResponse>;
}

export async function saveReporterEmail(
  payload: SaveReporterEmailRequest
): Promise<SaveReporterEmailResponse> {
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

  return response.json() as Promise<SaveReporterEmailResponse>;
}

export async function accessReporterCase(
  payload: ReporterAccessRequest
): Promise<ReporterCaseAccessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/reports/access`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load case.");
  }

  return response.json() as Promise<ReporterCaseAccessResponse>;
}
