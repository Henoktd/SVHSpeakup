import type { AppConfig } from "../config/appConfig";

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export class DataverseClient {
  private cachedToken: CachedToken | null = null;

  constructor(private readonly config: AppConfig["dataverse"]) {}

  async createRow(
    entitySetName: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(this.buildEntityUrl(entitySetName), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
      },
      body: JSON.stringify(payload)
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

  private buildEntityUrl(entitySetName: string) {
    return `${this.getApiRoot()}/${entitySetName}`;
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
    const filter = `${fieldName} eq '${fieldValue.replace(/'/g, "''")}'`;
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

    const data = (await response.json()) as {
      value?: Array<Record<string, unknown>>;
    };
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
