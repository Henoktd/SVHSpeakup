import type { AppConfig } from "../config/appConfig.js";

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface ChoiceMetadataResponse {
  OptionSet?: {
    Options?: Array<{
      Value?: number;
      Label?: {
        UserLocalizedLabel?: {
          Label?: string;
        } | null;
      } | null;
    }>;
  };
}

export interface DataverseChoiceOption {
  label: string;
  value: number;
}

interface DataverseListResponse {
  value?: Array<Record<string, unknown>>;
}

interface QueryRowsOptions {
  filter?: string;
  orderBy?: string;
  select?: string[];
  top?: number;
}

export class DataverseClient {
  private cachedToken: CachedToken | null = null;

  constructor(private readonly config: AppConfig["dataverse"]) {}

  async createRow(
    entitySetName: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const sanitizedPayload = this.sanitizeCreatePayload(payload);
    const response = await fetch(this.buildEntityUrl(entitySetName), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
      },
      body: JSON.stringify(sanitizedPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Dataverse create failed for ${entitySetName}: ${response.status} ${errorText}`
      );
    }
  }

  async updateFirstByField(
    entitySetName: string,
    fieldName: string,
    fieldValue: string,
    primaryIdField: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const recordId = await this.findFirstRecordId(
      entitySetName,
      fieldName,
      fieldValue,
      primaryIdField,
      accessToken
    );

    if (!recordId) {
      throw new Error(`No ${entitySetName} record found for ${fieldName}=${fieldValue}.`);
    }

    const response = await fetch(
      `${this.buildEntityUrl(entitySetName)}(${recordId})`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Dataverse update failed for ${entitySetName}: ${response.status} ${errorText}`
      );
    }
  }

  async getFirstRowByField(
    entitySetName: string,
    fieldName: string,
    fieldValue: string,
    select?: string[]
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.queryRows(entitySetName, {
      filter: `${fieldName} eq '${this.escapeFilterValue(fieldValue)}'`,
      select,
      top: 1
    });

    return rows[0] ?? null;
  }

  async queryRows(
    entitySetName: string,
    options: QueryRowsOptions = {}
  ): Promise<Array<Record<string, unknown>>> {
    const accessToken = await this.getAccessToken();
    const queryParts: string[] = [];

    if (options.select && options.select.length > 0) {
      queryParts.push(`$select=${options.select.join(",")}`);
    }

    if (options.filter) {
      queryParts.push(`$filter=${encodeURIComponent(options.filter)}`);
    }

    if (options.orderBy) {
      queryParts.push(`$orderby=${encodeURIComponent(options.orderBy)}`);
    }

    if (typeof options.top === "number") {
      queryParts.push(`$top=${options.top}`);
    }

    const queryString =
      queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    const response = await fetch(
      `${this.buildEntityUrl(entitySetName)}${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "OData-MaxVersion": "4.0",
          "OData-Version": "4.0"
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Dataverse query failed for ${entitySetName}: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as DataverseListResponse;

    return data.value ?? [];
  }

  async getChoiceOptions(
    entityLogicalName: string,
    fieldLogicalName: string
  ): Promise<DataverseChoiceOption[]> {
    const accessToken = await this.getAccessToken();
    const metadataTypes = [
      "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
      "Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata"
    ];
    let lastError: string | null = null;

    for (const metadataType of metadataTypes) {
      const response = await fetch(
        `${this.getApiRoot()}/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes(LogicalName='${fieldLogicalName}')/${metadataType}?$select=LogicalName&$expand=OptionSet`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
          }
        }
      );

      if (!response.ok) {
        lastError = `${response.status} ${await response.text()}`;
        continue;
      }

      const data = (await response.json()) as ChoiceMetadataResponse;
      const options =
        data.OptionSet?.Options?.flatMap((option) => {
          const label = option.Label?.UserLocalizedLabel?.Label?.trim();
          const value = option.Value;

          if (!label || typeof value !== "number" || !Number.isInteger(value)) {
            return [];
          }

          return [{ label, value }];
        }) ?? [];

      return options;
    }

    throw new Error(
      `Dataverse metadata lookup failed for ${entityLogicalName}.${fieldLogicalName}: ${lastError ?? "Unsupported choice column."}`
    );
  }

  private buildEntityUrl(entitySetName: string) {
    return `${this.getApiRoot()}/${entitySetName}`;
  }

  private sanitizeCreatePayload(payload: Record<string, unknown>) {
    const sanitizedPayload = { ...payload };

    // This legacy optional column was removed from the reporter form. Some cPanel
    // deployments/env mappings may still try to send it, but the rebuilt Dataverse
    // table no longer has this property.
    delete sanitizedPayload.svh_presidentialescalationotherdetail;

    return sanitizedPayload;
  }

  private getApiRoot() {
    return `${this.getOrganizationUrl()}/api/data/${this.config.apiVersion}`;
  }

  private async findFirstRecordId(
    entitySetName: string,
    fieldName: string,
    fieldValue: string,
    primaryIdField: string,
    accessToken: string
  ): Promise<string | null> {
    const filter = `${fieldName} eq '${this.escapeFilterValue(fieldValue)}'`;
    const url = `${this.buildEntityUrl(
      entitySetName
    )}?$select=${primaryIdField}&$filter=${encodeURIComponent(filter)}&$top=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Dataverse lookup failed for ${entitySetName}: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as DataverseListResponse;
    const firstRecord = data.value?.[0];

    if (!firstRecord) {
      return null;
    }

    const idValue = firstRecord[primaryIdField];
    return typeof idValue === "string" ? idValue : null;
  }

  private getOrganizationUrl() {
    return this.config.organizationUrl!.replace(/\/$/, "");
  }

  private escapeFilterValue(value: string) {
    return value.replace(/'/g, "''");
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.value;
    }

    const tenantId = this.config.tenantId!;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: this.config.clientId!,
      client_secret: this.config.clientSecret!,
      grant_type: "client_credentials",
      scope: `${this.getOrganizationUrl()}/.default`
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Unable to acquire Dataverse access token: ${response.status} ${errorText}`
      );
    }

    const token = (await response.json()) as AccessTokenResponse;

    this.cachedToken = {
      value: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000
    };

    return token.access_token;
  }
}
