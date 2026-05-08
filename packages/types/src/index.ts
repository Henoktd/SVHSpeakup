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

export const presidentialEscalationFactorValues = [
  "involving_ceo_or_senior_leadership",
  "conflict_of_interest_at_leadership_level",
  "fear_of_retaliation",
  "issue_was_ignored_or_mishandled_locally",
  "significant_risk_level_on_venture",
  "cross_venture_impact",
  "other"
] as const;

export const potentialImpactValues = ["low", "medium", "high"] as const;

export const urgencyValues = [
  "immediate_24_hrs",
  "high_few_days",
  "moderate",
  "low"
] as const;

export type PresidentialEscalationFactor =
  (typeof presidentialEscalationFactorValues)[number];
export type PotentialImpact = (typeof potentialImpactValues)[number];
export type UrgencyLevel = (typeof urgencyValues)[number];

export const presidentialEscalationFactorLabels: Record<
  PresidentialEscalationFactor,
  string
> = {
  involving_ceo_or_senior_leadership: "Involving CEO or senior leadership",
  conflict_of_interest_at_leadership_level:
    "Conflict of interest at leadership level",
  fear_of_retaliation: "Fear of retaliation",
  issue_was_ignored_or_mishandled_locally:
    "Issue was ignored or mishandled locally",
  significant_risk_level_on_venture: "Significant risk level on venture",
  cross_venture_impact: "Cross-venture impact",
  other: "Other"
};

export const potentialImpactLabels: Record<PotentialImpact, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

export const urgencyLabels: Record<UrgencyLevel, string> = {
  immediate_24_hrs: "Immediate (24 hrs)",
  high_few_days: "High (few days)",
  moderate: "Moderate",
  low: "Low"
};

export const createReportSchema = z.object({
  category: z.string().trim().min(1).max(100),
  title: z.string().trim().min(8).max(100),
  description: z.string().trim().min(30).max(100),
  incidentDateText: z.string().trim().min(2).max(140),
  locationText: z.string().trim().min(2).max(100),
  peopleInvolved: z.string().trim().max(100).optional().or(z.literal("")),
  evidenceNotes: z.string().trim().max(100).optional().or(z.literal("")),
  raisedThroughNormalChannels: z.boolean({
    required_error:
      "Select whether the issue has already been raised through normal channels."
  }),
  normalChannelActionSummary: z.string().trim().max(100),
  presidentialEscalationReason: z.string().trim().min(10).max(100),
  presidentialEscalationFactors: z
    .array(z.enum(presidentialEscalationFactorValues))
    .min(1, {
      message: "Select at least one reason for presidential escalation."
    }),
  presidentialEscalationOtherDetail: z.string().trim().max(100),
  potentialImpact: z.enum(potentialImpactValues, {
    errorMap: () => ({
      message: "Select the potential impact if the issue is not addressed."
    })
  }),
  urgency: z.enum(urgencyValues, {
    errorMap: () => ({
      message: "Select the urgency for this issue."
    })
  }),
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
}).superRefine((value, context) => {
  if (
    value.raisedThroughNormalChannels &&
    value.normalChannelActionSummary.trim().length < 2
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Summarize what action was taken or not taken.",
      path: ["normalChannelActionSummary"]
    });
  }

  if (
    value.presidentialEscalationFactors.includes("other") &&
    value.presidentialEscalationOtherDetail.trim().length < 2
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Describe the other escalation factor.",
      path: ["presidentialEscalationOtherDetail"]
    });
  }
});

export type CaseStatus = (typeof caseStatusValues)[number];
export type ReportCategory = string;
export type CreateReportRequest = z.infer<typeof createReportSchema>;

export interface CreateReportResponse {
  caseId: string;
  secret: string;
  submittedAt: string;
}

export interface ReportCategoryOption {
  value: string;
  label: string;
}

export interface ReporterFormOptionsResponse {
  categories: ReportCategoryOption[];
}

export const saveReporterEmailSchema = z.object({
  caseId: z.string().trim().min(1),
  secret: z.string().trim().min(1),
  reporterEmail: z.string().trim().email()
});

export type SaveReporterEmailRequest = z.infer<typeof saveReporterEmailSchema>;

export interface SaveReporterEmailResponse {
  saved: boolean;
  emailed: boolean;
}

export const reporterAccessSchema = z.object({
  caseId: z.string().trim().min(1),
  secret: z.string().trim().min(1)
});

export type ReporterAccessRequest = z.infer<typeof reporterAccessSchema>;

export interface CaseActivityEvent {
  eventType: string;
  actorType: string;
  summary: string;
  createdAt: string;
}

export interface ReporterCaseAccessResponse {
  caseId: string;
  title: string;
  description: string;
  categoryLabel: string;
  status: CaseStatus;
  statusLabel: string;
  submittedAt: string;
  lastActivityAt: string;
  incidentDateText: string | null;
  locationText: string;
  peopleInvolved: string;
  evidenceNotes: string;
  reporterEmail: string | null;
  raisedThroughNormalChannels: boolean;
  normalChannelActionSummary: string;
  presidentialEscalationReason: string;
  presidentialEscalationFactorLabels: string[];
  presidentialEscalationOtherDetail: string;
  potentialImpactLabel: string | null;
  urgencyLabel: string | null;
  activity: CaseActivityEvent[];
}

export interface InvestigatorCaseListItem {
  caseId: string;
  title: string;
  descriptionSnippet: string;
  categoryLabel: string;
  status: CaseStatus;
  statusLabel: string;
  submittedAt: string;
  lastActivityAt: string;
  reporterEmail: string | null;
}

export interface InvestigatorCasesResponse {
  cases: InvestigatorCaseListItem[];
}

export interface InvestigatorCaseDetailResponse
  extends InvestigatorCaseListItem {
  description: string;
  incidentDateText: string | null;
  locationText: string;
  peopleInvolved: string;
  evidenceNotes: string;
  confidentialityAccepted: boolean;
  consentAccepted: boolean;
  raisedThroughNormalChannels: boolean;
  normalChannelActionSummary: string;
  presidentialEscalationReason: string;
  presidentialEscalationFactorLabels: string[];
  presidentialEscalationOtherDetail: string;
  potentialImpactLabel: string | null;
  urgencyLabel: string | null;
  activity: CaseActivityEvent[];
}

export const investigatorCaseUpdateSchema = z.object({
  status: z.enum(caseStatusValues)
});

export type InvestigatorCaseUpdateRequest = z.infer<
  typeof investigatorCaseUpdateSchema
>;

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
