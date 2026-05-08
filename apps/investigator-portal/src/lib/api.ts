import type {
  InvestigatorCaseDetailResponse,
  InvestigatorCasesResponse
} from "@svh/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

function buildAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export async function getInvestigatorCases(
  accessToken: string
): Promise<InvestigatorCasesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/investigator/cases`, {
    headers: buildAuthHeaders(accessToken)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load investigator cases.");
  }

  return response.json() as Promise<InvestigatorCasesResponse>;
}

export async function getInvestigatorCase(
  accessToken: string,
  caseId: string
): Promise<InvestigatorCaseDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/investigator/cases/${encodeURIComponent(caseId)}`,
    {
      headers: buildAuthHeaders(accessToken)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load investigator case.");
  }

  return response.json() as Promise<InvestigatorCaseDetailResponse>;
}
