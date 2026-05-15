import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { config as loadEnv } from "dotenv";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createReportSchema,
  reporterAccessSchema,
  saveReporterEmailSchema
} from "../../../packages/types/src/index.js";
import { hashSecret } from "../../../packages/utils/src/index.js";
import { getAppConfig } from "./config/appConfig.js";
import { DataverseReportRepository } from "./services/dataverseReportRepository.js";
import { createInvestigatorAuthMiddleware } from "./services/investigatorAuth.js";
import { ReporterEmailService } from "./services/reporterEmailService.js";
import {
  createAuditEvent,
  createCaseRecord,
  sanitizeReportPayload
} from "./services/reportService.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const envCandidates = [
  path.resolve(currentDirectory, "../.env"),
  path.resolve(currentDirectory, "../../../.env"),
  path.resolve(currentDirectory, "../../../../.env"),
  path.resolve(currentDirectory, "../../../../../../.env")
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath, override: true });
  }
}

const app = express();
const port = Number(process.env.PORT ?? 3001);
const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024
  }
});
const appConfig = getAppConfig();
const reportRepository = new DataverseReportRepository(appConfig.dataverse);
const reporterEmailService = new ReporterEmailService(appConfig);
const investigatorAuthMiddleware = createInvestigatorAuthMiddleware(
  appConfig.investigatorAuth
);
const buildMarker = "2026-05-15-smtp-diagnostics";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || appConfig.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json());

function parseCreateReportBody(request: express.Request): unknown {
  if (typeof request.body?.payload === "string") {
    return JSON.parse(request.body.payload);
  }

  return request.body;
}

function getEvidenceFiles(request: express.Request): Express.Multer.File[] {
  return Array.isArray(request.files) ? request.files : [];
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function appendEvidenceFileSummary(
  payload: unknown,
  files: Express.Multer.File[]
): unknown {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    files.length === 0
  ) {
    return payload;
  }

  const submittedPayload = payload as Record<string, unknown>;
  const existingNotes =
    typeof submittedPayload.evidenceNotes === "string"
      ? submittedPayload.evidenceNotes.trim()
      : "";
  const fileSummary = `Evidence files uploaded: ${files
    .map((file) => sanitizeFileName(file.originalname || "unnamed file"))
    .join(", ")}`;
  const evidenceNotes = [existingNotes, fileSummary]
    .filter(Boolean)
    .join("\n")
    .slice(0, 500);

  return {
    ...submittedPayload,
    evidenceNotes
  };
}

async function saveEvidenceFiles(
  caseId: string,
  files: Express.Multer.File[]
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const uploadRoot =
    process.env.EVIDENCE_UPLOAD_DIR ??
    path.resolve(process.env.HOME ?? currentDirectory, "svh-speakup-evidence");
  const caseUploadDirectory = path.join(uploadRoot, caseId);

  await mkdir(caseUploadDirectory, { recursive: true });

  await Promise.all(
    files.map((file, index) => {
      const safeName = sanitizeFileName(file.originalname || "evidence-file");
      const fileName = `${String(index + 1).padStart(2, "0")}-${randomUUID()}-${safeName}`;

      return writeFile(path.join(caseUploadDirectory, fileName), file.buffer);
    })
  );
}

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    build: {
      marker: buildMarker
    },
    dataverse: {
      mode: appConfig.dataverse.mode,
      configured: appConfig.dataverse.configured,
      fieldMappings: {
        presidentialEscalationReason:
          appConfig.dataverse.caseFields.presidentialEscalationReason,
        presidentialEscalationFactors:
          appConfig.dataverse.caseFields.presidentialEscalationFactors,
        presidentialEscalationOtherDetail:
          appConfig.dataverse.caseFields.presidentialEscalationOtherDetail
      }
    },
    smtp: {
      deliveryMode: appConfig.smtp.configured
        ? "smtp"
        : appConfig.smtp.useEthereal
          ? "ethereal"
          : "disabled",
      configured: appConfig.smtp.configured,
      useEthereal: appConfig.smtp.useEthereal,
      hostConfigured: Boolean(appConfig.smtp.host),
      fromConfigured: Boolean(appConfig.smtp.from),
      authConfigured: !appConfig.smtp.user || Boolean(appConfig.smtp.password)
    }
  });
});

app.get("/api/reports/options", async (_request, response) => {
  try {
    const categories = await reportRepository.getReporterCategoryOptions();

    response.json({
      categories
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load report form options.";

    response.status(500).json({
      message
    });
  }
});

app.post(
  "/api/reports",
  evidenceUpload.array("evidenceFiles", 5),
  async (request, response) => {
    let requestBody: unknown;

    try {
      requestBody = parseCreateReportBody(request);
    } catch {
      response.status(400).json({
        message: "Invalid report payload."
      });
      return;
    }

    const evidenceFiles = getEvidenceFiles(request);
    const parsed = createReportSchema.safeParse(
      appendEvidenceFileSummary(requestBody, evidenceFiles)
    );

    if (!parsed.success) {
      response.status(400).json({
        message: "Invalid request body.",
        issues: parsed.error.flatten()
      });
      return;
    }

    const sanitizedInput = sanitizeReportPayload(parsed.data);
    const record = createCaseRecord(sanitizedInput);
    const auditEvent = createAuditEvent(record.caseId);

    try {
      await saveEvidenceFiles(record.caseId, evidenceFiles);
      await reportRepository.createReport(record, auditEvent);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create report.";

      response.status(500).json({
        message
      });
      return;
    }

    response.status(201).json({
      caseId: record.caseId,
      secret: record.secret,
      submittedAt: record.submittedAt
    });
  }
);

app.post("/api/reports/access", async (request, response) => {
  const parsed = reporterAccessSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      message: "Invalid access request body.",
      issues: parsed.error.flatten()
    });
    return;
  }

  try {
    const reporterCase = await reportRepository.getReporterCaseBySecretHash(
      parsed.data.caseId,
      hashSecret(parsed.data.secret)
    );

    if (!reporterCase) {
      response.status(401).json({
        message: "Case ID or secret is invalid."
      });
      return;
    }

    response.status(200).json(reporterCase);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the reporter case.";

    response.status(500).json({
      message
    });
  }
});

app.post("/api/reports/email", async (request, response) => {
  const parsed = saveReporterEmailSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      message: "Invalid email request body.",
      issues: parsed.error.flatten()
    });
    return;
  }

  try {
    const reporterCase = await reportRepository.getReporterCaseBySecretHash(
      parsed.data.caseId,
      hashSecret(parsed.data.secret)
    );

    if (!reporterCase) {
      response.status(401).json({
        message: "Case ID or secret is invalid."
      });
      return;
    }

    await reportRepository.saveReporterEmail(
      parsed.data.caseId,
      parsed.data.reporterEmail
    );

    const emailDelivery = await reporterEmailService.sendAccessEmail({
      caseId: parsed.data.caseId,
      secret: parsed.data.secret,
      reporterEmail: parsed.data.reporterEmail,
      submittedAt: reporterCase.submittedAt
    });

    response.status(200).json({
      saved: true,
      ...emailDelivery
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save reporter email.";

    response.status(500).json({
      message
    });
    return;
  }
});

app.get("/api/investigator/cases", async (_request, response) => {
  investigatorAuthMiddleware(_request, response, async () => {
  try {
    const cases = await reportRepository.listInvestigatorCases();

    response.status(200).json({
      cases
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load investigator cases.";

    response.status(500).json({
      message
    });
  }
  });
});

app.get("/api/investigator/cases/:caseId", async (request, response) => {
  investigatorAuthMiddleware(request, response, async () => {
  try {
    const caseDetail = await reportRepository.getInvestigatorCase(
      request.params.caseId
    );

    if (!caseDetail) {
      response.status(404).json({
        message: "Case not found."
      });
      return;
    }

    response.status(200).json(caseDetail);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load the investigator case.";

    response.status(500).json({
      message
    });
  }
  });
});

app.listen(port, () => {
  console.log(`SVH SpeakUp API listening on port ${port}`);
  console.log(
    `Dataverse mode: ${appConfig.dataverse.mode} (${appConfig.dataverse.configured ? "configured" : "not configured"})`
  );
  console.log(
    `SMTP delivery: ${appConfig.smtp.configured ? "smtp" : appConfig.smtp.useEthereal ? "ethereal" : "disabled"} (host: ${Boolean(appConfig.smtp.host)}, from: ${Boolean(appConfig.smtp.from)}, auth: ${!appConfig.smtp.user || Boolean(appConfig.smtp.password)})`
  );
});
