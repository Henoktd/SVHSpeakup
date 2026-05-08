import { z } from "zod";

const envSchema = z.object({
  DATAVERSE_MODE: z.enum(["mock", "live"]).default("mock"),
  DATAVERSE_URL: z.string().url().optional(),
  DATAVERSE_TENANT_ID: z.string().min(1).optional(),
  DATAVERSE_CLIENT_ID: z.string().min(1).optional(),
  DATAVERSE_CLIENT_SECRET: z.string().min(1).optional(),
  DATAVERSE_API_VERSION: z.string().min(1).default("v9.2"),
  DATAVERSE_CASES_LOGICAL_NAME: z.string().min(1).default("svh_cases"),
  DATAVERSE_CASES_ENTITY_SET: z.string().min(1).default("svh_caseses"),
  DATAVERSE_AUDIT_ENTITY_SET: z.string().min(1).default("svh_case_audit_eventses"),
  DATAVERSE_CASE_ID_FIELD: z.string().min(1).default("svh_caseid"),
  DATAVERSE_SECRET_HASH_FIELD: z.string().min(1).default("svh_secrethash"),
  DATAVERSE_CATEGORY_FIELD: z.string().min(1).default("svh_category"),
  DATAVERSE_CATEGORY_OPTION_MAP: z.string().optional(),
  DATAVERSE_TITLE_FIELD: z.string().min(1).default("svh_title"),
  DATAVERSE_DESCRIPTION_FIELD: z.string().min(1).default("svh_description"),
  DATAVERSE_INCIDENT_DATE_FIELD: z.string().min(1).default("svh_incidentdate"),
  DATAVERSE_LOCATION_FIELD: z.string().min(1).default("svh_location"),
  DATAVERSE_PEOPLE_INVOLVED_FIELD: z.string().min(1).default("svh_peopleinvolved"),
  DATAVERSE_EVIDENCE_NOTES_FIELD: z.string().min(1).default("svh_evidencenotes"),
  DATAVERSE_RAISED_THROUGH_NORMAL_CHANNELS_FIELD: z
    .string()
    .min(1)
    .default("svh_raisedthroughnormalchannels"),
  DATAVERSE_NORMAL_CHANNEL_ACTION_SUMMARY_FIELD: z
    .string()
    .min(1)
    .default("svh_normalchannelactionsummary"),
  DATAVERSE_PRESIDENTIAL_ESCALATION_REASON_FIELD: z
    .string()
    .min(1)
    .default("svh_presidentialescalationreason"),
  DATAVERSE_PRESIDENTIAL_ESCALATION_FACTORS_FIELD: z
    .string()
    .min(1)
    .default("svh_presidentialescalationfactors"),
  DATAVERSE_PRESIDENTIAL_ESCALATION_FACTORS_OPTION_MAP: z.string().optional(),
  DATAVERSE_PRESIDENTIAL_ESCALATION_OTHER_DETAIL_FIELD: z
    .string()
    .min(1)
    .default("svh_presidentialescalationotherdetail"),
  DATAVERSE_POTENTIAL_IMPACT_FIELD: z
    .string()
    .min(1)
    .default("svh_potentialimpact"),
  DATAVERSE_POTENTIAL_IMPACT_OPTION_MAP: z.string().optional(),
  DATAVERSE_URGENCY_FIELD: z.string().min(1).default("svh_urgency"),
  DATAVERSE_URGENCY_OPTION_MAP: z.string().optional(),
  DATAVERSE_STATUS_FIELD: z.string().min(1).default("svh_status"),
  DATAVERSE_STATUS_OPTION_MAP: z.string().optional(),
  DATAVERSE_SUBMITTED_AT_FIELD: z.string().min(1).default("svh_submissiondate"),
  DATAVERSE_REPORTER_EMAIL_FIELD: z.string().min(1).default("svh_reporteremail"),
  DATAVERSE_CONFIDENTIALITY_FIELD: z.string().min(1).default("svh_confidentialityaccepted"),
  DATAVERSE_CONSENT_FIELD: z.string().min(1).default("svh_consentaccepted"),
  DATAVERSE_AUDIT_CASE_ID_FIELD: z.string().min(1).default("svh_caseid"),
  DATAVERSE_AUDIT_EVENT_TYPE_FIELD: z.string().min(1).default("svh_eventtype"),
  DATAVERSE_AUDIT_ACTOR_TYPE_FIELD: z.string().min(1).default("svh_actortype"),
  DATAVERSE_AUDIT_SUMMARY_FIELD: z.string().min(1).default("svh_summary"),
  DATAVERSE_AUDIT_CREATED_AT_FIELD: z.string().min(1).default("svh_createdat"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  REPORTER_PORTAL_URL: z.string().url().default("http://localhost:5173"),
  INVESTIGATOR_PORTAL_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  INVESTIGATOR_AUTH_ENABLED: z.coerce.boolean().default(false),
  INVESTIGATOR_ENTRA_TENANT_ID: z.string().min(1).optional(),
  INVESTIGATOR_API_AUDIENCES: z.string().optional(),
  INVESTIGATOR_ALLOWED_GROUP_IDS: z.string().optional(),
  INVESTIGATOR_ALLOWED_ROLE_VALUES: z.string().optional(),
  INVESTIGATOR_ALLOWED_USER_OIDS: z.string().optional()
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
    casesLogicalName: string;
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
      raisedThroughNormalChannels: string;
      normalChannelActionSummary: string;
      presidentialEscalationReason: string;
      presidentialEscalationFactors: string;
      presidentialEscalationOtherDetail: string;
      potentialImpact: string;
      urgency: string;
      status: string;
      submittedAt: string;
      reporterEmail: string;
      confidentialityAccepted: string;
      consentAccepted: string;
    };
    optionMaps: {
      category: Record<string, number>;
      presidentialEscalationFactors: Record<string, number>;
      potentialImpact: Record<string, number>;
      urgency: Record<string, number>;
      status: Record<string, number>;
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
  investigatorAuth: {
    enabled: boolean;
    configured: boolean;
    authorizationConfigured: boolean;
    tenantId?: string;
    audiences: string[];
    allowedGroupIds: string[];
    allowedRoleValues: string[];
    allowedUserOids: string[];
  };
  corsAllowedOrigins: string[];
  reporterPortalUrl: string;
  investigatorPortalUrl?: string;
}

let cachedConfig: AppConfig | null = null;

function parseIntegerMap(
  rawValue: string | undefined,
  envName: string
): Record<string, number> {
  if (!rawValue?.trim()) {
    return {};
  }

  const parsed = JSON.parse(rawValue) as Record<string, unknown>;
  const entries = Object.entries(parsed);

  for (const [key, value] of entries) {
    if (!Number.isInteger(value)) {
      throw new Error(`${envName} must map "${key}" to an integer.`);
    }
  }

  return Object.fromEntries(entries) as Record<string, number>;
}

function parseStringList(rawValue: string | undefined): string[] {
  if (!rawValue?.trim()) {
    return [];
  }

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function toOrigin(urlOrOrigin: string): string {
  try {
    return new URL(urlOrOrigin).origin;
  } catch {
    return urlOrOrigin.trim();
  }
}

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
  const investigatorAudiences = parseStringList(
    parsed.INVESTIGATOR_API_AUDIENCES
  );
  const investigatorAllowedGroupIds = parseStringList(
    parsed.INVESTIGATOR_ALLOWED_GROUP_IDS
  );
  const investigatorAllowedRoleValues = parseStringList(
    parsed.INVESTIGATOR_ALLOWED_ROLE_VALUES
  );
  const investigatorAllowedUserOids = parseStringList(
    parsed.INVESTIGATOR_ALLOWED_USER_OIDS
  );
  const investigatorAuthorizationConfigured =
    investigatorAllowedGroupIds.length > 0 ||
    investigatorAllowedRoleValues.length > 0 ||
    investigatorAllowedUserOids.length > 0;
  const corsAllowedOrigins = Array.from(
    new Set(
      [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        parsed.REPORTER_PORTAL_URL,
        parsed.INVESTIGATOR_PORTAL_URL,
        ...parseStringList(parsed.CORS_ALLOWED_ORIGINS)
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => toOrigin(value))
    )
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
      casesLogicalName: parsed.DATAVERSE_CASES_LOGICAL_NAME,
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
        raisedThroughNormalChannels:
          parsed.DATAVERSE_RAISED_THROUGH_NORMAL_CHANNELS_FIELD,
        normalChannelActionSummary:
          parsed.DATAVERSE_NORMAL_CHANNEL_ACTION_SUMMARY_FIELD,
        presidentialEscalationReason:
          parsed.DATAVERSE_PRESIDENTIAL_ESCALATION_REASON_FIELD,
        presidentialEscalationFactors:
          parsed.DATAVERSE_PRESIDENTIAL_ESCALATION_FACTORS_FIELD,
        presidentialEscalationOtherDetail:
          parsed.DATAVERSE_PRESIDENTIAL_ESCALATION_OTHER_DETAIL_FIELD,
        potentialImpact: parsed.DATAVERSE_POTENTIAL_IMPACT_FIELD,
        urgency: parsed.DATAVERSE_URGENCY_FIELD,
        status: parsed.DATAVERSE_STATUS_FIELD,
        submittedAt: parsed.DATAVERSE_SUBMITTED_AT_FIELD,
        reporterEmail: parsed.DATAVERSE_REPORTER_EMAIL_FIELD,
        confidentialityAccepted: parsed.DATAVERSE_CONFIDENTIALITY_FIELD,
        consentAccepted: parsed.DATAVERSE_CONSENT_FIELD
      },
      optionMaps: {
        category: parseIntegerMap(
          parsed.DATAVERSE_CATEGORY_OPTION_MAP,
          "DATAVERSE_CATEGORY_OPTION_MAP"
        ),
        presidentialEscalationFactors: parseIntegerMap(
          parsed.DATAVERSE_PRESIDENTIAL_ESCALATION_FACTORS_OPTION_MAP,
          "DATAVERSE_PRESIDENTIAL_ESCALATION_FACTORS_OPTION_MAP"
        ),
        potentialImpact: parseIntegerMap(
          parsed.DATAVERSE_POTENTIAL_IMPACT_OPTION_MAP,
          "DATAVERSE_POTENTIAL_IMPACT_OPTION_MAP"
        ),
        urgency: parseIntegerMap(
          parsed.DATAVERSE_URGENCY_OPTION_MAP,
          "DATAVERSE_URGENCY_OPTION_MAP"
        ),
        status: parseIntegerMap(
          parsed.DATAVERSE_STATUS_OPTION_MAP,
          "DATAVERSE_STATUS_OPTION_MAP"
        )
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
    },
    investigatorAuth: {
      enabled: parsed.INVESTIGATOR_AUTH_ENABLED,
      configured: Boolean(
        parsed.INVESTIGATOR_AUTH_ENABLED &&
          parsed.INVESTIGATOR_ENTRA_TENANT_ID &&
          investigatorAudiences.length > 0
      ),
      authorizationConfigured: investigatorAuthorizationConfigured,
      tenantId: parsed.INVESTIGATOR_ENTRA_TENANT_ID,
      audiences: investigatorAudiences,
      allowedGroupIds: investigatorAllowedGroupIds,
      allowedRoleValues: investigatorAllowedRoleValues,
      allowedUserOids: investigatorAllowedUserOids
    },
    corsAllowedOrigins,
    reporterPortalUrl: parsed.REPORTER_PORTAL_URL,
    investigatorPortalUrl: parsed.INVESTIGATOR_PORTAL_URL
  };

  return cachedConfig;
}
