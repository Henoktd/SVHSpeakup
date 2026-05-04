import { config as loadEnv } from "dotenv";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReportSchema, saveReporterEmailSchema } from "@svh/types";
import { getAppConfig } from "./config/appConfig";
import { DataverseReportRepository } from "./services/dataverseReportRepository";
import {
  createAuditEvent,
  createCaseRecord,
  sanitizeReportPayload
} from "./services/reportService";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

loadEnv({
  path: path.resolve(currentDirectory, "../../../.env")
});

const app = express();
const port = Number(process.env.PORT ?? 3001);
const appConfig = getAppConfig();
const reportRepository = new DataverseReportRepository(appConfig.dataverse);

app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"]
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
    await reportRepository.saveReporterEmail(
      parsed.data.caseId,
      parsed.data.reporterEmail
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save reporter email.";

    response.status(500).json({
      message
    });
    return;
  }

  response.status(200).json({
    saved: true
  });
});

app.listen(port, () => {
  console.log(`SVH SpeakUp API listening on port ${port}`);
  console.log(
    `Dataverse mode: ${appConfig.dataverse.mode} (${appConfig.dataverse.configured ? "configured" : "not configured"})`
  );
});
