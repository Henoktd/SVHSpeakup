# Dataverse Schema

## Core tables

### `cases`

Primary case record for each report.

Suggested fields:

- `caseId`: human-readable case reference such as `SVH-2026-000123`
- `secretHash`: hashed reporter secret or passphrase
- `category`: report category
- `title`: short summary
- `description`: detailed incident description
- `incidentDateText`: flexible incident date text
- `locationText`: freeform location
- `peopleInvolved`: optional named parties
- `evidenceNotes`: optional notes about evidence
- `severity`: low, medium, high, critical
- `status`: new, triage, investigating, waiting_for_reporter, resolved, closed
- `assignedTo`: investigator reference
- `sourceChannel`: web, mobile, hotline, import
- `submittedAt`: submission timestamp
- `lastReporterMessageAt`: most recent anonymous reporter activity
- `lastInvestigatorMessageAt`: most recent investigator activity
- `lastActivityAt`: last activity timestamp
- `slaDueAt`: calculated SLA deadline
- `isEscalated`: escalation flag
- `confidentialityAccepted`: boolean
- `consentAccepted`: boolean

### `case_messages`

Anonymous follow-up and investigator communications.

Suggested fields:

- `caseLookup`: relation to `cases`
- `authorType`: reporter or investigator
- `body`: message content
- `visibility`: reporter_thread or internal_only
- `createdAt`: timestamp
- `createdBy`: investigator reference when applicable

### `case_attachments`

Attachment metadata and file references.

Suggested fields:

- `caseLookup`: relation to `cases`
- `messageLookup`: optional relation to `case_messages`
- `fileName`: original filename
- `contentType`: MIME type
- `fileSizeBytes`: size
- `storageType`: dataverse_file or blob
- `storageReference`: file column reference or blob URL/key
- `uploadedByType`: reporter or investigator
- `uploadedAt`: timestamp
- `scanStatus`: pending, passed, failed

### `case_audit_events`

Immutable audit trail for key actions.

Suggested fields:

- `caseLookup`: relation to `cases`
- `eventType`: created, assigned, status_changed, message_posted, attachment_uploaded, note_added
- `actorType`: system, reporter, investigator, flow
- `actorId`: optional investigator or service identifier
- `summary`: short action summary
- `detailsJson`: structured payload
- `createdAt`: timestamp

### `case_notes`

Internal-only investigator notes.

Suggested fields:

- `caseLookup`: relation to `cases`
- `body`: note content
- `createdBy`: investigator reference
- `createdAt`: timestamp

### `categories`

Admin-managed reporting categories and routing logic.

Suggested fields:

- `name`: display name
- `slug`: stable identifier
- `description`: help text
- `defaultSeverity`: default severity
- `isActive`: boolean
- `slaHours`: target handling window

## Relationships

- One `cases` record has many `case_messages`
- One `cases` record has many `case_attachments`
- One `cases` record has many `case_audit_events`
- One `cases` record has many `case_notes`
- One `categories` record can map to many `cases`

## Security notes

- Never store reporter secrets in plaintext
- Investigator roles should be enforced through Entra identity and backend authorization
- Anonymous access should only expose case thread data after valid `caseId` and secret verification
- Audit records should be append-only
