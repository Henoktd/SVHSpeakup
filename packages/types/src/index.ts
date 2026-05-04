import { z } from "zod";

export const caseStatusValues = [
  "new",
  "triage",
  "investigating",
  "waiting_for_reporter",
  "resolved",
  "closed"
] as const;

export const reportCategoryValues = [
  "harassment",
  "fraud",
  "corruption",
  "misconduct",
  "other"
] as const;

export const createReportSchema = z.object({
  category: z.enum(reportCategoryValues),
  title: z.string().trim().min(8).max(140),
  description: z.string().trim().min(30).max(5000),
  incidentDateText: z.string().trim().min(2).max(140),
  locationText: z.string().trim().min(2).max(140),
  peopleInvolved: z.string().trim().max(1000).optional().or(z.literal("")),
  evidenceNotes: z.string().trim().max(1000).optional().or(z.literal("")),
  confidentialityAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You need to acknowledge the confidentiality notice."
    })
  }),
  consentAccepted: z.literal(true, {
    errorMap: () => ({
      message: "You need to confirm the report is submitted in good faith."
    })
  })
});

export type CaseStatus = (typeof caseStatusValues)[number];
export type ReportCategory = (typeof reportCategoryValues)[number];
export type CreateReportRequest = z.infer<typeof createReportSchema>;

export interface CreateReportResponse {
  caseId: string;
  secret: string;
  submittedAt: string;
}

export const saveReporterEmailSchema = z.object({
  caseId: z.string().trim().min(1),
  reporterEmail: z.string().trim().email()
});

export type SaveReporterEmailRequest = z.infer<typeof saveReporterEmailSchema>;

export interface CreateCaseRecord extends CreateReportRequest {
  caseId: string;
  secretHash: string;
  status: CaseStatus;
  submittedAt: string;
  reporterEmail?: string;
}

export interface CreateAuditEvent {
  caseId: string;
  eventType: "created";
  actorType: "reporter";
  createdAt: string;
  summary: string;
}
