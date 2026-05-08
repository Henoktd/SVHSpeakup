import type {
  CreateAuditEvent,
  CreateCaseRecord,
  CreateReportRequest
} from "@svh/types";
import {
  generateCaseId,
  generateReporterSecret,
  hashSecret,
  sanitizeText
} from "@svh/utils";

export function sanitizeReportPayload(
  payload: CreateReportRequest
): CreateReportRequest {
  return {
    ...payload,
    title: sanitizeText(payload.title),
    description: sanitizeText(payload.description),
    incidentDateText: sanitizeText(payload.incidentDateText),
    locationText: sanitizeText(payload.locationText),
    peopleInvolved: sanitizeText(payload.peopleInvolved ?? ""),
    evidenceNotes: sanitizeText(payload.evidenceNotes ?? ""),
    normalChannelActionSummary: sanitizeText(
      payload.normalChannelActionSummary
    ),
    presidentialEscalationReason: sanitizeText(
      payload.presidentialEscalationReason
    ),
    presidentialEscalationOtherDetail: sanitizeText(
      payload.presidentialEscalationOtherDetail
    ),
    presidentialEscalationFactors: Array.from(
      new Set(payload.presidentialEscalationFactors)
    )
  };
}

export function createCaseRecord(
  payload: CreateReportRequest
): CreateCaseRecord & { secret: string } {
  const submittedAt = new Date().toISOString();
  const caseId = generateCaseId();
  const secret = generateReporterSecret();
  const secretHash = hashSecret(secret);

  return {
    ...payload,
    caseId,
    secret,
    secretHash,
    status: "new" as const,
    submittedAt
  };
}

export function createAuditEvent(caseId: string): CreateAuditEvent {
  return {
    caseId,
    eventType: "created",
    actorType: "reporter",
    createdAt: new Date().toISOString(),
    summary: "Anonymous report submitted."
  };
}
