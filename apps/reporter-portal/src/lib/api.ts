import type {
  ReporterAccessRequest,
  ReporterCaseAccessResponse,
  CreateReportRequest,
  CreateReportResponse,
  ReporterFormOptionsResponse,
  SaveReporterEmailRequest,
  SaveReporterEmailResponse
} from "@svh/types";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

function getApiBaseUrl(): string {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }

  throw new Error(
    "Reporter API base URL is not configured for this deployment."
  );
}

export async function createReport(
  payload: CreateReportRequest,
  evidenceFiles: File[] = []
): Promise<CreateReportResponse> {
  const apiBaseUrl = getApiBaseUrl();

  if (evidenceFiles.length > 0) {
    const formData = new FormData();

    formData.append("payload", JSON.stringify(payload));

    for (const file of evidenceFiles) {
      formData.append("evidenceFiles", file);
    }

    const response = await fetch(`${apiBaseUrl}/api/reports`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Unable to submit report.");
    }

    return response.json() as Promise<CreateReportResponse>;
  }

  const response = await fetch(`${apiBaseUrl}/api/reports`, {
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
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/reports/options`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load report form options.");
  }

  return response.json() as Promise<ReporterFormOptionsResponse>;
}

export async function saveReporterEmail(
  payload: SaveReporterEmailRequest
): Promise<SaveReporterEmailResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/reports/email`, {
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
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/reports/access`, {
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
