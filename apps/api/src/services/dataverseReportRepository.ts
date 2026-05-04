import type { CreateAuditEvent, CreateCaseRecord } from "@svh/types";
import type { AppConfig } from "../config/appConfig";
import { DataverseClient } from "./dataverseClient";

export class DataverseReportRepository {
  private readonly client: DataverseClient | null;

  constructor(private readonly config: AppConfig["dataverse"]) {
    this.client =
      config.mode === "live" && config.configured
        ? new DataverseClient(config)
        : null;
  }

  async createReport(
    caseRecord: CreateCaseRecord,
    auditEvent: CreateAuditEvent
  ): Promise<void> {
    if (this.config.mode === "mock") {
      this.logMockWrite(caseRecord, auditEvent);
      return;
    }

    if (!this.client) {
      throw new Error(
        "Dataverse live mode is enabled but the required environment variables are incomplete."
      );
    }

    await this.client.createRow(
      this.config.casesEntitySet,
      this.mapCasePayload(caseRecord)
    );

    await this.client.createRow(
      this.config.auditEntitySet,
      this.mapAuditPayload(auditEvent)
    );
  }

  async saveReporterEmail(caseId: string, reporterEmail: string): Promise<void> {
    if (this.config.mode === "mock") {
      console.log(
        JSON.stringify(
          {
            mode: "mock",
            action: "saveReporterEmail",
            caseId,
            reporterEmail
          },
          null,
          2
        )
      );
      return;
    }

    if (!this.client) {
      throw new Error(
        "Dataverse live mode is enabled but the required environment variables are incomplete."
      );
    }

    await this.client.updateFirstByField(
      this.config.casesEntitySet,
      this.config.caseFields.caseId,
      caseId,
      "caseid",
      {
        [this.config.caseFields.reporterEmail]: reporterEmail
      }
    );
  }

  private mapCasePayload(caseRecord: CreateCaseRecord): Record<string, unknown> {
    return {
      [this.config.caseFields.caseId]: caseRecord.caseId,
      [this.config.caseFields.secretHash]: caseRecord.secretHash,
      [this.config.caseFields.category]: caseRecord.category,
      [this.config.caseFields.title]: caseRecord.title,
      [this.config.caseFields.description]: caseRecord.description,
      [this.config.caseFields.incidentDateText]: caseRecord.incidentDateText,
      [this.config.caseFields.locationText]: caseRecord.locationText,
      [this.config.caseFields.peopleInvolved]: caseRecord.peopleInvolved,
      [this.config.caseFields.evidenceNotes]: caseRecord.evidenceNotes,
      [this.config.caseFields.status]: caseRecord.status,
      [this.config.caseFields.submittedAt]: caseRecord.submittedAt,
      [this.config.caseFields.reporterEmail]: caseRecord.reporterEmail ?? null,
      [this.config.caseFields.confidentialityAccepted]:
        caseRecord.confidentialityAccepted,
      [this.config.caseFields.consentAccepted]: caseRecord.consentAccepted
    };
  }

  private mapAuditPayload(
    auditEvent: CreateAuditEvent
  ): Record<string, unknown> {
    return {
      [this.config.auditFields.caseId]: auditEvent.caseId,
      [this.config.auditFields.eventType]: auditEvent.eventType,
      [this.config.auditFields.actorType]: auditEvent.actorType,
      [this.config.auditFields.summary]: auditEvent.summary,
      [this.config.auditFields.createdAt]: auditEvent.createdAt
    };
  }

  private logMockWrite(
    caseRecord: CreateCaseRecord,
    auditEvent: CreateAuditEvent
  ) {
    console.log(
      JSON.stringify(
        {
          mode: "mock",
          casesEntitySet: this.config.casesEntitySet,
          auditEntitySet: this.config.auditEntitySet,
          caseRecord: this.mapCasePayload(caseRecord),
          auditEvent: this.mapAuditPayload(auditEvent)
        },
        null,
        2
      )
    );
  }
}
