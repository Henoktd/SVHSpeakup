# SVH SpeakUp

SVH SpeakUp is a whistleblowing platform blueprint transformed into a practical monorepo foundation.

The planned product includes:

- A public reporter portal for anonymous submissions and follow-up
- An authenticated investigator portal for case handling
- A backend API between the portals and Microsoft Dataverse

## Workspace layout

```text
svh-speakup/
  apps/
    reporter-portal/
    investigator-portal/
    api/
  packages/
    ui/
    types/
    config/
    utils/
  docs/
    architecture.md
    dataverse-schema.md
    api-contract.md
```

## Architecture direction

This repository follows the blueprint's recommended first implementation choice:

- Public reporter React app
- Investigator React app with Microsoft Entra authentication
- Azure Functions style backend API in TypeScript
- Microsoft Dataverse as the system of record
- Dataverse file columns for MVP attachments
- Power Automate for notifications

## Current status

This repo currently contains the initial project foundation:

- Product and technical documentation
- Monorepo workspace configuration
- App and package scaffolding
- Dataverse-ready backend wiring with environment-based configuration

## Suggested next steps

1. Finalize early build decisions in `docs/architecture.md`
2. Configure `.env` with real Dataverse table and field names
3. Implement the Dataverse schema
4. Add investigator authentication and case views in `apps/investigator-portal`
