import type {
  CaseActivityEvent,
  CaseStatus,
  CreateAuditEvent,
  CreateCaseRecord,
  InvestigatorCaseDetailResponse,
  InvestigatorCaseListItem,
  ReportCategoryOption,
  ReporterCaseAccessResponse
} from "../../../../packages/types/src/index.js";
import { reportCategoryValues } from "../../../../packages/types/src/index.js";
import type { AppConfig } from "../config/appConfig.js";
import type { DataverseChoiceOption } from "./dataverseClient.js";
import { DataverseClient } from "./dataverseClient.js";

interface ChoiceLookupItem {
  key: string;
  label: string;
  value: number;
}

interface StoredCaseRecord {
  caseId: string;
  secretHash: string;
  categoryValue: number | null;
  title: string;
  description: string;
  incidentDateText: string | null;
  locationText: string;
  peopleInvolved: string;
  evidenceNotes: string;
  raisedThroughNormalChannels: boolean;
  normalChannelActionSummary: string;
  presidentialEscalationReason: string;
  presidentialEscalationFactorValues: number[];
  presidentialEscalationOtherDetail: string;
  potentialImpactValue: number | null;
  urgencyValue: number | null;
  statusValue: number | null;
  submittedAt: string;
  reporterEmail: string | null;
  confidentialityAccepted: boolean;
  consentAccepted: boolean;
}

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

    const casePayload = await this.mapCasePayload(caseRecord);

    await this.client.createRow(this.config.casesEntitySet, casePayload);

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
      this.getCasePrimaryIdField(),
      {
        [this.config.caseFields.reporterEmail]: reporterEmail
      }
    );
  }

  async getReporterCategoryOptions(): Promise<ReportCategoryOption[]> {
    const options = await this.getChoiceOptions(
      this.config.caseFields.category,
      this.config.optionMaps.category,
      reportCategoryValues
    );

    return options.map((option) => ({
      value: option.value.toString(),
      label: option.label
    }));
  }

  async getReporterCaseBySecretHash(
    caseId: string,
    secretHash: string
  ): Promise<ReporterCaseAccessResponse | null> {
    const [
      caseRecord,
      activity,
      categoryLookup,
      factorLookup,
      potentialImpactLookup,
      statusLookup,
      urgencyLookup
    ] =
      await Promise.all([
        this.getStoredCaseRecord(caseId),
        this.getActivityEvents(caseId),
        this.getChoiceLookup(
          this.config.caseFields.category,
          this.config.optionMaps.category
        ),
        this.getChoiceLookup(
          this.config.caseFields.presidentialEscalationFactors,
          this.config.optionMaps.presidentialEscalationFactors
        ),
        this.getChoiceLookup(
          this.config.caseFields.potentialImpact,
          this.config.optionMaps.potentialImpact
        ),
        this.getChoiceLookup(
          this.config.caseFields.status,
          this.config.optionMaps.status
        ),
        this.getChoiceLookup(
          this.config.caseFields.urgency,
          this.config.optionMaps.urgency
        )
      ]);

    if (!caseRecord || caseRecord.secretHash !== secretHash) {
      return null;
    }

    return this.toReporterCaseAccessResponse(
      caseRecord,
      activity,
      categoryLookup,
      factorLookup,
      potentialImpactLookup,
      statusLookup,
      urgencyLookup
    );
  }

  async listInvestigatorCases(): Promise<InvestigatorCaseListItem[]> {
    if (!this.client) {
      return [];
    }

    const [rows, activityMap, categoryLookup, statusLookup] = await Promise.all([
      this.client.queryRows(this.config.casesEntitySet, {
        orderBy: `${this.config.caseFields.submittedAt} desc`,
        select: this.getCaseSelectFields(),
        top: 100
      }),
      this.getActivityEventMap(),
      this.getChoiceLookup(
        this.config.caseFields.category,
        this.config.optionMaps.category
      ),
      this.getChoiceLookup(
        this.config.caseFields.status,
        this.config.optionMaps.status
      )
    ]);

    return rows
      .map((row) => this.toStoredCaseRecord(row))
      .filter((caseRecord): caseRecord is StoredCaseRecord => caseRecord !== null)
      .map((caseRecord) =>
        this.toInvestigatorCaseListItem(
          caseRecord,
          activityMap.get(caseRecord.caseId) ?? [],
          categoryLookup,
          statusLookup
        )
      );
  }

  async getInvestigatorCase(
    caseId: string
  ): Promise<InvestigatorCaseDetailResponse | null> {
    const [
      caseRecord,
      activity,
      categoryLookup,
      factorLookup,
      potentialImpactLookup,
      statusLookup,
      urgencyLookup
    ] =
      await Promise.all([
        this.getStoredCaseRecord(caseId),
        this.getActivityEvents(caseId),
        this.getChoiceLookup(
          this.config.caseFields.category,
          this.config.optionMaps.category
        ),
        this.getChoiceLookup(
          this.config.caseFields.presidentialEscalationFactors,
          this.config.optionMaps.presidentialEscalationFactors
        ),
        this.getChoiceLookup(
          this.config.caseFields.potentialImpact,
          this.config.optionMaps.potentialImpact
        ),
        this.getChoiceLookup(
          this.config.caseFields.status,
          this.config.optionMaps.status
        ),
        this.getChoiceLookup(
          this.config.caseFields.urgency,
          this.config.optionMaps.urgency
        )
      ]);

    if (!caseRecord) {
      return null;
    }

    const listItem = this.toInvestigatorCaseListItem(
      caseRecord,
      activity,
      categoryLookup,
      statusLookup
    );

    return {
      ...listItem,
      description: caseRecord.description,
      incidentDateText: caseRecord.incidentDateText,
      locationText: caseRecord.locationText,
      peopleInvolved: caseRecord.peopleInvolved,
      evidenceNotes: caseRecord.evidenceNotes,
      confidentialityAccepted: caseRecord.confidentialityAccepted,
      consentAccepted: caseRecord.consentAccepted,
      raisedThroughNormalChannels: caseRecord.raisedThroughNormalChannels,
      normalChannelActionSummary: caseRecord.normalChannelActionSummary,
      presidentialEscalationReason: caseRecord.presidentialEscalationReason,
      presidentialEscalationFactorLabels: this.getChoiceLabels(
        caseRecord.presidentialEscalationFactorValues,
        factorLookup
      ),
      presidentialEscalationOtherDetail:
        caseRecord.presidentialEscalationOtherDetail,
      potentialImpactLabel: this.getNullableChoiceLabel(
        caseRecord.potentialImpactValue,
        potentialImpactLookup
      ),
      urgencyLabel: this.getNullableChoiceLabel(
        caseRecord.urgencyValue,
        urgencyLookup
      ),
      activity
    };
  }

  private async getStoredCaseRecord(
    caseId: string
  ): Promise<StoredCaseRecord | null> {
    if (!this.client) {
      return null;
    }

    const row = await this.client.getFirstRowByField(
      this.config.casesEntitySet,
      this.config.caseFields.caseId,
      caseId,
      this.getCaseSelectFields()
    );

    return row ? this.toStoredCaseRecord(row) : null;
  }

  private async getActivityEvents(caseId: string): Promise<CaseActivityEvent[]> {
    if (!this.client) {
      return [];
    }

    const rows = await this.client.queryRows(this.config.auditEntitySet, {
      filter: `${this.config.auditFields.caseId} eq '${this.escapeFilterValue(caseId)}'`,
      orderBy: `${this.config.auditFields.createdAt} asc`,
      select: [
        this.config.auditFields.caseId,
        this.config.auditFields.eventType,
        this.config.auditFields.actorType,
        this.config.auditFields.summary,
        this.config.auditFields.createdAt
      ],
      top: 100
    });

    return rows.map((row) => this.toActivityEvent(row));
  }

  private async getActivityEventMap(): Promise<Map<string, CaseActivityEvent[]>> {
    if (!this.client) {
      return new Map();
    }

    const rows = await this.client.queryRows(this.config.auditEntitySet, {
      orderBy: `${this.config.auditFields.createdAt} asc`,
      select: [
        this.config.auditFields.caseId,
        this.config.auditFields.eventType,
        this.config.auditFields.actorType,
        this.config.auditFields.summary,
        this.config.auditFields.createdAt
      ],
      top: 500
    });

    const eventMap = new Map<string, CaseActivityEvent[]>();

    for (const row of rows) {
      const caseId = this.readString(row, this.config.auditFields.caseId);

      if (!caseId) {
        continue;
      }

      const existingEvents = eventMap.get(caseId) ?? [];
      existingEvents.push(this.toActivityEvent(row));
      eventMap.set(caseId, existingEvents);
    }

    return eventMap;
  }

  private async mapCasePayload(
    caseRecord: CreateCaseRecord
  ): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {
      [this.config.caseFields.caseId]: caseRecord.caseId,
      [this.config.caseFields.secretHash]: caseRecord.secretHash,
      [this.config.caseFields.title]: caseRecord.title,
      [this.config.caseFields.description]: caseRecord.description,
      [this.config.caseFields.locationText]: caseRecord.locationText,
      [this.config.caseFields.raisedThroughNormalChannels]:
        caseRecord.raisedThroughNormalChannels,
      [this.config.caseFields.confidentialityAccepted]:
        caseRecord.confidentialityAccepted,
      [this.config.caseFields.consentAccepted]: caseRecord.consentAccepted
    };

    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.peopleInvolved,
      caseRecord.peopleInvolved ?? ""
    );
    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.evidenceNotes,
      caseRecord.evidenceNotes ?? ""
    );
    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.normalChannelActionSummary,
      caseRecord.normalChannelActionSummary
    );
    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.presidentialEscalationReason,
      caseRecord.presidentialEscalationReason ?? ""
    );
    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.presidentialEscalationOtherDetail,
      caseRecord.presidentialEscalationOtherDetail
    );
    this.assignNonEmptyStringField(
      payload,
      this.config.caseFields.reporterEmail,
      caseRecord.reporterEmail ?? ""
    );

    this.assignField(
      payload,
      this.config.caseFields.category,
      await this.resolveChoiceValue(
        caseRecord.category,
        this.config.caseFields.category,
        this.config.optionMaps.category
      )
    );
    this.assignField(
      payload,
      this.config.caseFields.presidentialEscalationFactors,
      await this.resolveMultiSelectChoiceValues(
        caseRecord.presidentialEscalationFactors,
        this.config.caseFields.presidentialEscalationFactors,
        this.config.optionMaps.presidentialEscalationFactors
      )
    );
    this.assignField(
      payload,
      this.config.caseFields.potentialImpact,
      await this.resolveChoiceValue(
        caseRecord.potentialImpact,
        this.config.caseFields.potentialImpact,
        this.config.optionMaps.potentialImpact
      )
    );
    this.assignField(
      payload,
      this.config.caseFields.urgency,
      await this.resolveChoiceValue(
        caseRecord.urgency,
        this.config.caseFields.urgency,
        this.config.optionMaps.urgency
      )
    );
    this.assignField(
      payload,
      this.config.caseFields.status,
      await this.resolveChoiceValue(
        caseRecord.status,
        this.config.caseFields.status,
        this.config.optionMaps.status
      )
    );
    this.assignField(
      payload,
      this.config.caseFields.incidentDateText,
      this.toDataverseDateTime(caseRecord.incidentDateText)
    );
    this.assignField(
      payload,
      this.config.caseFields.submittedAt,
      this.toDataverseDateTime(caseRecord.submittedAt)
    );

    return payload;
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

  private toReporterCaseAccessResponse(
    caseRecord: StoredCaseRecord,
    activity: CaseActivityEvent[],
    categoryLookup: Map<number, ChoiceLookupItem>,
    factorLookup: Map<number, ChoiceLookupItem>,
    potentialImpactLookup: Map<number, ChoiceLookupItem>,
    statusLookup: Map<number, ChoiceLookupItem>,
    urgencyLookup: Map<number, ChoiceLookupItem>
  ): ReporterCaseAccessResponse {
    const status = this.getStatusPresentation(caseRecord.statusValue, statusLookup);
    const categoryLabel = this.getChoiceLabel(
      caseRecord.categoryValue,
      categoryLookup
    );
    const lastActivityAt =
      activity.at(-1)?.createdAt ?? caseRecord.submittedAt;

    return {
      caseId: caseRecord.caseId,
      title: caseRecord.title,
      description: caseRecord.description,
      categoryLabel,
      status: status.status,
      statusLabel: status.label,
      submittedAt: caseRecord.submittedAt,
      lastActivityAt,
      incidentDateText: caseRecord.incidentDateText,
      locationText: caseRecord.locationText,
      peopleInvolved: caseRecord.peopleInvolved,
      evidenceNotes: caseRecord.evidenceNotes,
      reporterEmail: caseRecord.reporterEmail,
      raisedThroughNormalChannels: caseRecord.raisedThroughNormalChannels,
      normalChannelActionSummary: caseRecord.normalChannelActionSummary,
      presidentialEscalationReason: caseRecord.presidentialEscalationReason,
      presidentialEscalationFactorLabels: this.getChoiceLabels(
        caseRecord.presidentialEscalationFactorValues,
        factorLookup
      ),
      presidentialEscalationOtherDetail:
        caseRecord.presidentialEscalationOtherDetail,
      potentialImpactLabel: this.getNullableChoiceLabel(
        caseRecord.potentialImpactValue,
        potentialImpactLookup
      ),
      urgencyLabel: this.getNullableChoiceLabel(
        caseRecord.urgencyValue,
        urgencyLookup
      ),
      activity
    };
  }

  private toInvestigatorCaseListItem(
    caseRecord: StoredCaseRecord,
    activity: CaseActivityEvent[],
    categoryLookup: Map<number, ChoiceLookupItem>,
    statusLookup: Map<number, ChoiceLookupItem>
  ): InvestigatorCaseListItem {
    const status = this.getStatusPresentation(caseRecord.statusValue, statusLookup);

    return {
      caseId: caseRecord.caseId,
      title: caseRecord.title,
      descriptionSnippet: this.toSnippet(caseRecord.description),
      categoryLabel: this.getChoiceLabel(caseRecord.categoryValue, categoryLookup),
      status: status.status,
      statusLabel: status.label,
      submittedAt: caseRecord.submittedAt,
      lastActivityAt: activity.at(-1)?.createdAt ?? caseRecord.submittedAt,
      reporterEmail: caseRecord.reporterEmail
    };
  }

  private toStoredCaseRecord(row: Record<string, unknown>): StoredCaseRecord | null {
    const caseId = this.readString(row, this.config.caseFields.caseId);
    const secretHash = this.readString(row, this.config.caseFields.secretHash);
    const title = this.readString(row, this.config.caseFields.title);
    const description = this.readString(row, this.config.caseFields.description);
    const submittedAt = this.readString(row, this.config.caseFields.submittedAt);

    if (!caseId || !secretHash || !title || !description || !submittedAt) {
      return null;
    }

    return {
      caseId,
      secretHash,
      categoryValue: this.readNumber(row, this.config.caseFields.category),
      title,
      description,
      incidentDateText:
        this.readOptionalString(row, this.config.caseFields.incidentDateText),
      locationText: this.readString(row, this.config.caseFields.locationText),
      peopleInvolved: this.readString(
        row,
        this.config.caseFields.peopleInvolved
      ),
      evidenceNotes: this.readString(row, this.config.caseFields.evidenceNotes),
      raisedThroughNormalChannels: this.readBoolean(
        row,
        this.config.caseFields.raisedThroughNormalChannels
      ),
      normalChannelActionSummary: this.readString(
        row,
        this.config.caseFields.normalChannelActionSummary
      ),
      presidentialEscalationReason: this.readString(
        row,
        this.config.caseFields.presidentialEscalationReason
      ),
      presidentialEscalationFactorValues: this.readMultiSelectNumbers(
        row,
        this.config.caseFields.presidentialEscalationFactors
      ),
      presidentialEscalationOtherDetail: this.readString(
        row,
        this.config.caseFields.presidentialEscalationOtherDetail
      ),
      potentialImpactValue: this.readNumber(
        row,
        this.config.caseFields.potentialImpact
      ),
      urgencyValue: this.readNumber(row, this.config.caseFields.urgency),
      statusValue: this.readNumber(row, this.config.caseFields.status),
      submittedAt,
      reporterEmail: this.readOptionalString(
        row,
        this.config.caseFields.reporterEmail
      ),
      confidentialityAccepted: this.readBoolean(
        row,
        this.config.caseFields.confidentialityAccepted
      ),
      consentAccepted: this.readBoolean(
        row,
        this.config.caseFields.consentAccepted
      )
    };
  }

  private toActivityEvent(row: Record<string, unknown>): CaseActivityEvent {
    return {
      eventType: this.readString(row, this.config.auditFields.eventType),
      actorType: this.readString(row, this.config.auditFields.actorType),
      summary: this.readString(row, this.config.auditFields.summary),
      createdAt: this.readString(row, this.config.auditFields.createdAt)
    };
  }

  private async getChoiceLookup(
    fieldName: string,
    optionMap: Record<string, number>
  ): Promise<Map<number, ChoiceLookupItem>> {
    const configuredEntries = Object.entries(optionMap);
    const configuredByValue = new Map<number, string>(
      configuredEntries.map(([key, value]) => [value, key])
    );
    const lookup = new Map<number, ChoiceLookupItem>();
    let options: DataverseChoiceOption[];

    try {
      options = await this.getChoiceOptions(fieldName, optionMap);
    } catch (error) {
      console.warn(
        `Dataverse choice lookup failed for ${this.config.casesLogicalName}.${fieldName}; continuing without labels. ${this.formatError(error)}`
      );
      return lookup;
    }

    for (const option of options) {
      const configuredKey =
        configuredByValue.get(option.value) ?? this.normalizeChoiceKey(option.label);

      lookup.set(option.value, {
        key: configuredKey,
        label: option.label,
        value: option.value
      });
    }

    return lookup;
  }

  private async getChoiceOptions(
    fieldName: string,
    optionMap: Record<string, number>,
    fallbackKeys: readonly string[] = []
  ): Promise<DataverseChoiceOption[]> {
    if (this.client) {
      try {
        return await this.client.getChoiceOptions(
          this.config.casesLogicalName,
          fieldName
        );
      } catch (error) {
        const fallbackOptions = this.getConfiguredChoiceOptions(
          optionMap,
          fallbackKeys
        );

        if (fallbackOptions.length > 0) {
          console.warn(
            `Dataverse metadata lookup failed for ${this.config.casesLogicalName}.${fieldName}; using configured option map fallback. ${this.formatError(error)}`
          );
          return fallbackOptions;
        }

        throw error;
      }
    }

    return this.getConfiguredChoiceOptions(optionMap, fallbackKeys);
  }

  private getConfiguredChoiceOptions(
    optionMap: Record<string, number>,
    fallbackKeys: readonly string[] = []
  ): DataverseChoiceOption[] {
    const mappedOptions = Object.entries(optionMap).map(([key, value]) => ({
      label: this.toChoiceLabel(key),
      value
    }));

    if (mappedOptions.length > 0) {
      return mappedOptions;
    }

    return fallbackKeys.map((key, index) => ({
      label: this.toChoiceLabel(key),
      value: index + 1
    }));
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private getStatusPresentation(
    value: number | null,
    lookup: Map<number, ChoiceLookupItem>
  ): { label: string; status: CaseStatus } {
    const item = value === null ? undefined : lookup.get(value);
    const fallbackStatus = "new" as const;

    return {
      label: item?.label ?? this.toChoiceLabel(fallbackStatus),
      status: this.isCaseStatus(item?.key) ? item.key : fallbackStatus
    };
  }

  private getChoiceLabel(
    value: number | null,
    lookup: Map<number, ChoiceLookupItem>
  ): string {
    if (value === null) {
      return "Unspecified";
    }

    return lookup.get(value)?.label ?? `Option ${value}`;
  }

  private getNullableChoiceLabel(
    value: number | null,
    lookup: Map<number, ChoiceLookupItem>
  ): string | null {
    if (value === null) {
      return null;
    }

    return this.getChoiceLabel(value, lookup);
  }

  private getChoiceLabels(
    values: number[],
    lookup: Map<number, ChoiceLookupItem>
  ): string[] {
    return values.map((value) => this.getChoiceLabel(value, lookup));
  }

  private getCaseSelectFields(): string[] {
    return Array.from(
      new Set([
        this.getCasePrimaryIdField(),
        this.config.caseFields.caseId,
        this.config.caseFields.secretHash,
        this.config.caseFields.category,
        this.config.caseFields.title,
        this.config.caseFields.description,
        this.config.caseFields.incidentDateText,
        this.config.caseFields.locationText,
        this.config.caseFields.peopleInvolved,
        this.config.caseFields.evidenceNotes,
        this.config.caseFields.raisedThroughNormalChannels,
        this.config.caseFields.normalChannelActionSummary,
        this.config.caseFields.presidentialEscalationReason,
        this.config.caseFields.presidentialEscalationFactors,
        this.config.caseFields.presidentialEscalationOtherDetail,
        this.config.caseFields.potentialImpact,
        this.config.caseFields.urgency,
        this.config.caseFields.status,
        this.config.caseFields.submittedAt,
        this.config.caseFields.reporterEmail,
        this.config.caseFields.confidentialityAccepted,
        this.config.caseFields.consentAccepted
      ])
    );
  }

  private getCasePrimaryIdField() {
    return `${this.config.casesLogicalName}id`;
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
          caseRecord,
          auditEvent: this.mapAuditPayload(auditEvent)
        },
        null,
        2
      )
    );
  }

  private assignField(
    payload: Record<string, unknown>,
    fieldName: string,
    value: unknown
  ) {
    if (value !== undefined) {
      payload[fieldName] = value;
    }
  }

  private assignNonEmptyStringField(
    payload: Record<string, unknown>,
    fieldName: string,
    value: string
  ) {
    if (value.trim()) {
      payload[fieldName] = value;
    }
  }

  private async resolveChoiceValue(
    submittedValue: string,
    fieldName: string,
    optionMap: Record<string, number>
  ): Promise<number | undefined> {
    const numericValue = Number.parseInt(submittedValue, 10);

    if (
      Number.isInteger(numericValue) &&
      numericValue.toString() === submittedValue.trim()
    ) {
      return numericValue;
    }

    const configuredValue = optionMap[submittedValue];

    if (configuredValue !== undefined) {
      return configuredValue;
    }

    if (this.client) {
      const options = await this.client.getChoiceOptions(
        this.config.casesLogicalName,
        fieldName
      );
      const normalizedSubmittedValue = this.normalizeChoiceKey(submittedValue);
      const matchedOption = options.find(
        (option) =>
          this.normalizeChoiceKey(option.label) === normalizedSubmittedValue ||
          option.label.localeCompare(submittedValue, undefined, {
            sensitivity: "accent"
          }) === 0
      );

      if (matchedOption) {
        return matchedOption.value;
      }

      throw new Error(
        `Unknown Dataverse choice "${submittedValue}" for ${fieldName}. Available choices: ${options
          .map(
            (option) =>
              `${this.normalizeChoiceKey(option.label)} (${option.label})`
          )
          .join(", ")}`
      );
    }

    return undefined;
  }

  private async resolveMultiSelectChoiceValues(
    submittedValues: string[],
    fieldName: string,
    optionMap: Record<string, number>
  ): Promise<string | undefined> {
    if (submittedValues.length === 0) {
      return undefined;
    }

    let resolvedValues: Array<number | undefined>;

    try {
      resolvedValues = await Promise.all(
        submittedValues.map((submittedValue) =>
          this.resolveChoiceValue(submittedValue, fieldName, optionMap)
        )
      );
    } catch (error) {
      console.warn(
        `Dataverse multi-select lookup failed for ${this.config.casesLogicalName}.${fieldName}; skipping this optional field. ${this.formatError(error)}`
      );
      return undefined;
    }

    const deduplicatedValues = Array.from(
      new Set(
        resolvedValues.filter((value): value is number => value !== undefined)
      )
    );

    if (deduplicatedValues.length === 0) {
      return undefined;
    }

    return deduplicatedValues.join(",");
  }

  private toDataverseDateTime(value: string): string | undefined {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return undefined;
    }

    const parsedDate = new Date(normalizedValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return undefined;
    }

    return parsedDate.toISOString();
  }

  private readBoolean(row: Record<string, unknown>, fieldName: string): boolean {
    return row[fieldName] === true;
  }

  private readNumber(
    row: Record<string, unknown>,
    fieldName: string
  ): number | null {
    const value = row[fieldName];

    return typeof value === "number" ? value : null;
  }

  private readMultiSelectNumbers(
    row: Record<string, unknown>,
    fieldName: string
  ): number[] {
    const value = row[fieldName];

    if (typeof value !== "string" || !value.trim()) {
      return [];
    }

    return value
      .split(",")
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((part) => Number.isInteger(part));
  }

  private readOptionalString(
    row: Record<string, unknown>,
    fieldName: string
  ): string | null {
    const value = row[fieldName];

    return typeof value === "string" && value.trim() ? value : null;
  }

  private readString(row: Record<string, unknown>, fieldName: string): string {
    const value = row[fieldName];

    return typeof value === "string" ? value : "";
  }

  private escapeFilterValue(value: string) {
    return value.replace(/'/g, "''");
  }

  private isCaseStatus(value: string | undefined): value is CaseStatus {
    return (
      value === "new" ||
      value === "triage" ||
      value === "investigating" ||
      value === "waiting_for_reporter" ||
      value === "resolved" ||
      value === "closed"
    );
  }

  private normalizeChoiceKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private toChoiceLabel(value: string): string {
    return value
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private toSnippet(value: string): string {
    const normalized = value.trim();

    if (normalized.length <= 120) {
      return normalized;
    }

    return `${normalized.slice(0, 117)}...`;
  }
}
