# Investigator Access

## Recommended access model

### Reporter tracker

Keep the tracker URL public, but never keep the case data open.

Recommended controls:

- Access only by `caseId` + `secret`
- Backend-only Dataverse access
- Rate limiting on anonymous endpoints
- Audit logging for tracker access attempts
- Optional later hardening with email OTP or magic link

This keeps anonymous follow-up possible without requiring a corporate login.

### Investigator portal

The investigator portal should require Microsoft Entra sign-in.

Recommended controls:

- Single-tenant Microsoft Entra application
- Protected API access token
- Authorization by Entra security group, app role, or named user object IDs
- No public anonymous access to investigator routes

## Fastest safe rollout for a few investigators

If you need a few people to access the custom investigator portal and see the
cases already stored in Dataverse:

1. Create a Microsoft Entra security group such as `SVH SpeakUp Investigators`.
2. Add the few approved investigators to that group.
3. Register two Entra applications:
   - SPA app for `apps/investigator-portal`
   - API app for `apps/api`
4. Expose an API scope on the API app, for example
   `api://<api-app-client-id>/investigator.read`.
5. Configure the SPA to request that scope.
6. Configure one of the API authorization inputs:
   - `INVESTIGATOR_ALLOWED_GROUP_IDS`
   - `INVESTIGATOR_ALLOWED_ROLE_VALUES`
   - `INVESTIGATOR_ALLOWED_USER_OIDS`
7. Set `INVESTIGATOR_AUTH_ENABLED=true`.

## Dataverse access note

The custom API currently reads Dataverse by using the configured application
identity, not the signed-in investigator's personal Dataverse token.

That means:

- Investigators can use the custom portal once they are authenticated and
  authorized in the app.
- Investigators do **not** need direct Dataverse UI permissions just to view
  cases through this custom portal.

However, if they also need to open the environment directly in Power Apps or
Dataverse, then you should also:

1. Add them to the environment security group.
2. Assign a Dataverse security role with the minimum required access.

## Environment variables used by this repo

Backend/API:

- `INVESTIGATOR_AUTH_ENABLED`
- `INVESTIGATOR_ENTRA_TENANT_ID`
- `INVESTIGATOR_API_AUDIENCES`
- `INVESTIGATOR_ALLOWED_GROUP_IDS`
- `INVESTIGATOR_ALLOWED_ROLE_VALUES`
- `INVESTIGATOR_ALLOWED_USER_OIDS`

Frontend/Vite:

- `VITE_INVESTIGATOR_ENTRA_TENANT_ID`
- `VITE_INVESTIGATOR_ENTRA_CLIENT_ID`
- `VITE_INVESTIGATOR_API_SCOPE`

## Current data scope

The live Dataverse environment currently exposes:

- `svh_cases`
- `svh_case_audit_events`

So the investigator portal can already show:

- case list
- case detail
- audit timeline

It does not yet have dedicated Dataverse tables for:

- reporter/investigator messages
- internal notes
- attachments
