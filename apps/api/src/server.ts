import fs from "node:fs";
import { config as loadEnv } from "dotenv";
import cors from "cors";
import express from "express";
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
const appConfig = getAppConfig();
const reportRepository = new DataverseReportRepository(appConfig.dataverse);
const reporterEmailService = new ReporterEmailService(appConfig);
const investigatorAuthMiddleware = createInvestigatorAuthMiddleware(
  appConfig.investigatorAuth
);

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

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    dataverse: {
      mode: appConfig.dataverse.mode,
      configured: appConfig.dataverse.configured
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

app.post("/api/reports", async (request, response) => {
  const parsed = createReportSchema.safeParse(request.body);

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
});

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

    const emailed = await reporterEmailService.sendAccessEmail({
      caseId: parsed.data.caseId,
      secret: parsed.data.secret,
      reporterEmail: parsed.data.reporterEmail,
      submittedAt: reporterCase.submittedAt
    });

    response.status(200).json({
      saved: true,
      emailed
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
});
