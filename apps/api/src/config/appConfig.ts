import { z } from "zod";

const envSchema = z.object({
  DATAVERSE_MODE: z.enum(["mock", "live"]).default("mock"),
  DATAVERSE_URL: z.string().url().optional(),
  DATAVERSE_TENANT_ID: z.string().min(1).optional(),
  DATAVERSE_CLIENT_ID: z.string().min(1).optional(),
  DATAVERSE_CLIENT_SECRET: z.string().min(1).optional(),
  DATAVERSE_API_VERSION: z.string().min(1).default("v9.2"),
  DATAVERSE_CASES_ENTITY_SET: z.string().min(1).default("cases"),
  DATAVERSE_AUDIT_ENTITY_SET: z.string().min(1).default("case_audit_events"),
  DATAVERSE_CASE_ID_FIELD: z.string().min(1).default("caseid"),
  DATAVERSE_SECRET_HASH_FIELD: z.string().min(1).default("secrethash"),
  DATAVERSE_CATEGORY_FIELD: z.string().min(1).default("category"),
  DATAVERSE_TITLE_FIELD: z.string().min(1).default("title"),
  DATAVERSE_DESCRIPTION_FIELD: z.string().min(1).default("description"),
  DATAVERSE_INCIDENT_DATE_FIELD: z.string().min(1).default("incidentdatetext"),
  DATAVERSE_LOCATION_FIELD: z.string().min(1).default("locationtext"),
  DATAVERSE_PEOPLE_INVOLVED_FIELD: z.string().min(1).default("peopleinvolved"),
  DATAVERSE_EVIDENCE_NOTES_FIELD: z.string().min(1).default("evidencenotes"),
  DATAVERSE_STATUS_FIELD: z.string().min(1).default("status"),
  DATAVERSE_SUBMITTED_AT_FIELD: z.string().min(1).default("submittedat"),
  DATAVERSE_REPORTER_EMAIL_FIELD: z.string().min(1).default("reporteremail"),
  DATAVERSE_CONFIDENTIALITY_FIELD: z.string().min(1).default("confidentialityaccepted"),
  DATAVERSE_CONSENT_FIELD: z.string().min(1).default("consentaccepted"),
  DATAVERSE_AUDIT_CASE_ID_FIELD: z.string().min(1).default("caseid"),
  DATAVERSE_AUDIT_EVENT_TYPE_FIELD: z.string().min(1).default("eventtype"),
  DATAVERSE_AUDIT_ACTOR_TYPE_FIELD: z.string().min(1).default("actortype"),
  DATAVERSE_AUDIT_SUMMARY_FIELD: z.string().min(1).default("summary"),
  DATAVERSE_AUDIT_CREATED_AT_FIELD: z.string().min(1).default("createdat"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional()
});

export interface AppConfig {
  dataverse: {
    mode: "mock" | "live";
    configured: boolean;
    organizationUrl?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    apiVersion: string;
    casesEntitySet: string;
    auditEntitySet: string;
    caseFields: {
      caseId: string;
      secretHash: string;
      category: string;
      title: string;
      description: string;
      incidentDateText: string;
      locationText: string;
      peopleInvolved: string;
      evidenceNotes: string;
      status: string;
      submittedAt: string;
      reporterEmail: string;
      confidentialityAccepted: string;
      consentAccepted: string;
    };
    auditFields: {
      caseId: string;
      eventType: string;
      actorType: string;
      summary: string;
      createdAt: string;
    };
  };
  smtp: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    from?: string;
    configured: boolean;
  };
}

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.parse(process.env);
  const configured = Boolean(
    parsed.DATAVERSE_URL &&
      parsed.DATAVERSE_TENANT_ID &&
      parsed.DATAVERSE_CLIENT_ID &&
      parsed.DATAVERSE_CLIENT_SECRET
  );

  cachedConfig = {
    dataverse: {
      mode: parsed.DATAVERSE_MODE,
      configured,
      organizationUrl: parsed.DATAVERSE_URL,
      tenantId: parsed.DATAVERSE_TENANT_ID,
      clientId: parsed.DATAVERSE_CLIENT_ID,
      clientSecret: parsed.DATAVERSE_CLIENT_SECRET,
      apiVersion: parsed.DATAVERSE_API_VERSION,
      casesEntitySet: parsed.DATAVERSE_CASES_ENTITY_SET,
      auditEntitySet: parsed.DATAVERSE_AUDIT_ENTITY_SET,
      caseFields: {
        caseId: parsed.DATAVERSE_CASE_ID_FIELD,
        secretHash: parsed.DATAVERSE_SECRET_HASH_FIELD,
        category: parsed.DATAVERSE_CATEGORY_FIELD,
        title: parsed.DATAVERSE_TITLE_FIELD,
        description: parsed.DATAVERSE_DESCRIPTION_FIELD,
        incidentDateText: parsed.DATAVERSE_INCIDENT_DATE_FIELD,
        locationText: parsed.DATAVERSE_LOCATION_FIELD,
        peopleInvolved: parsed.DATAVERSE_PEOPLE_INVOLVED_FIELD,
        evidenceNotes: parsed.DATAVERSE_EVIDENCE_NOTES_FIELD,
        status: parsed.DATAVERSE_STATUS_FIELD,
        submittedAt: parsed.DATAVERSE_SUBMITTED_AT_FIELD,
        reporterEmail: parsed.DATAVERSE_REPORTER_EMAIL_FIELD,
        confidentialityAccepted: parsed.DATAVERSE_CONFIDENTIALITY_FIELD,
        consentAccepted: parsed.DATAVERSE_CONSENT_FIELD
      },
      auditFields: {
        caseId: parsed.DATAVERSE_AUDIT_CASE_ID_FIELD,
        eventType: parsed.DATAVERSE_AUDIT_EVENT_TYPE_FIELD,
        actorType: parsed.DATAVERSE_AUDIT_ACTOR_TYPE_FIELD,
        summary: parsed.DATAVERSE_AUDIT_SUMMARY_FIELD,
        createdAt: parsed.DATAVERSE_AUDIT_CREATED_AT_FIELD
      }
    },
    smtp: {
      host: parsed.SMTP_HOST,
      port: parsed.SMTP_PORT,
      secure: parsed.SMTP_SECURE,
      user: parsed.SMTP_USER,
      password: parsed.SMTP_PASSWORD,
      from: parsed.SMTP_FROM,
      configured: Boolean(
        parsed.SMTP_HOST &&
          parsed.SMTP_USER &&
          parsed.SMTP_PASSWORD &&
          parsed.SMTP_FROM
      )
    }
  };

  return cachedConfig;
}
