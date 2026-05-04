# API Contract

## Public endpoints

### `POST /api/reports`

Creates a new anonymous report.

Request body:

```json
{
  "category": "harassment",
  "title": "Concern about repeated conduct",
  "description": "Detailed description...",
  "incidentDateText": "Last week",
  "locationText": "Addis office",
  "peopleInvolved": "Optional",
  "evidenceNotes": "Optional",
  "confidentialityAccepted": true,
  "consentAccepted": true
}
```

Response body:

```json
{
  "caseId": "SVH-2026-000123",
  "secret": "RIVER-GLASS-4821",
  "submittedAt": "2026-04-23T09:00:00Z"
}
```

### `POST /api/reports/access`

Validates reporter access using case ID and secret.

Request body:

```json
{
  "caseId": "SVH-2026-000123",
  "secret": "RIVER-GLASS-4821"
}
```

Response body:

```json
{
  "caseId": "SVH-2026-000123",
  "status": "waiting_for_reporter",
  "lastActivityAt": "2026-04-23T12:00:00Z"
}
```

### `GET /api/reports/:caseId/thread`

Returns the anonymous reporter thread after access validation.

### `POST /api/reports/:caseId/messages`

Adds a reporter message to the anonymous thread.

Request body:

```json
{
  "secret": "RIVER-GLASS-4821",
  "body": "I can provide more detail about the incident."
}
```

## Investigator endpoints

These endpoints require Entra-authenticated investigator access.

### `GET /api/investigator/cases`

Returns paginated cases with filtering on:

- status
- category
- severity
- assigned investigator
- date range

### `GET /api/investigator/cases/:caseId`

Returns a full case view including:

- case metadata
- attachments
- reporter thread
- internal notes
- audit events

### `PATCH /api/investigator/cases/:caseId`

Updates workflow fields such as:

- status
- severity
- assignment
- tags

### `POST /api/investigator/cases/:caseId/messages`

Adds an investigator-visible thread message intended for the anonymous reporter.

### `POST /api/investigator/cases/:caseId/notes`

Creates an internal-only case note.

### `POST /api/investigator/cases/:caseId/attachments`

Uploads an investigator attachment or supporting file.

## Non-functional requirements

- Validate requests with Zod
- Sanitize text inputs before persistence
- Hash reporter secrets before storage
- Record audit events for all case mutations
- Apply rate limiting to anonymous endpoints
- Scan attachments before release to investigators

## Dataverse integration notes

The current backend supports two persistence modes:

- `mock`: logs the mapped Dataverse payload locally for development
- `live`: authenticates with Microsoft Entra ID using client credentials and creates rows through the Dataverse Web API

To enable live mode, set `DATAVERSE_MODE=live` and provide the environment values in `.env.example`.

The implementation uses the Dataverse Web API and Microsoft identity platform client credentials flow with the `scope={organization-url}/.default` pattern, following Microsoft Learn guidance:

- Dataverse Web API overview: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview
- Create row via Web API: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-entity-web-api
- Client credentials and `/.default`: https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow
