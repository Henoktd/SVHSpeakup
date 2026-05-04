# Architecture

## Product goal

SVH SpeakUp is a FaceUp-style whistleblowing platform with:

- Anonymous report submission
- Secure case management
- Anonymous follow-up messaging
- Attachments and evidence support
- Role-based investigation workflows
- Auditability and reporting

## System shape

The platform is split into three applications:

1. `apps/reporter-portal`
   Public-facing React app for anonymous reporters.
2. `apps/investigator-portal`
   Authenticated React app for investigators, HR, and compliance teams.
3. `apps/api`
   TypeScript backend that mediates anonymous access, investigator permissions, and Dataverse persistence.

## Why the backend is mandatory

The blueprint explicitly avoids direct anonymous browser access to Dataverse because Dataverse Web API access requires authenticated OAuth flows. Anonymous reporting must pass through a controlled backend that can:

- Validate and sanitize input
- Generate case references and reporter secrets
- Enforce anonymous access rules
- Write to Dataverse securely
- Create audit events

## Recommended MVP stack

- Frontend: React, TypeScript, Vite, React Router, React Hook Form, Zod, TanStack Query
- Backend: TypeScript with an Azure Functions-friendly structure
- Platform: Microsoft Dataverse, Microsoft Entra ID, Power Automate, Power BI

## MVP functional scope

### Reporter portal

- Home / landing page
- Start report flow
- Report form
- Submission confirmation
- Check existing case
- Anonymous message thread
- File upload
- Privacy and confidentiality notice

### Investigator portal

- Dashboard
- Case inbox
- Case detail view
- Message thread
- Attachments panel
- Activity timeline
- Assignment and status controls
- Search and filters
- Analytics page
- Settings for categories and SLA rules

### Backend API

- Accept anonymous submissions
- Validate and sanitize input
- Generate case reference and secret
- Persist cases, messages, and audit events to Dataverse
- Handle attachments
- Expose anonymous follow-up endpoints
- Enforce investigator permissions
- Trigger notifications

## Status model

Cases should support the following lifecycle:

- `new`
- `triage`
- `investigating`
- `waiting_for_reporter`
- `resolved`
- `closed`

## Delivery phases

### Phase 1: Foundation

- Create Dataverse schema
- Set up backend project
- Create React apps
- Configure Entra auth for investigator access

### Phase 2: Submission flow

- Build report form
- Create submission endpoint
- Generate Case ID and secret
- Save the first report record in Dataverse

### Phase 3: Investigator workflow

- Dashboard
- Case queue
- Case detail
- Status and assignment
- Internal notes

### Phase 4: Anonymous messaging

- Reporter access flow
- Reporter thread
- Investigator-reporter communication

### Phase 5: Hardening

- Auditing
- Notifications
- File scanning
- Rate limiting
- Logging and monitoring

## Early decisions to confirm

- Whether the reporter portal is public internet-facing or restricted
- Whether attachments stay in Dataverse file columns or move to Blob Storage
- Whether the backend runs as Azure Functions or an Express service
- Whether reporter access uses a passphrase or magic-link style flow
- Whether notifications are owned by Power Automate or the backend

## Recommended default decisions

Unless business constraints say otherwise, this repository assumes:

- Public internet-facing reporter portal
- Entra-authenticated investigator portal
- Azure Functions-style backend
- Dataverse file columns for MVP attachments
- Reporter access by Case ID plus secret/passphrase
- Power Automate notifications
