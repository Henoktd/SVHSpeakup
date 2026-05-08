# Deploying SVH SpeakUp to cPanel

This repo is prepared for a cPanel hosting shape that mirrors the successful PAES setup, while accounting for the extra Node API in this project.

## Recommended Production URLs

- `https://www.sol-ventures.com` for the main corporate website
- `https://speak.sol-ventures.com` for the public reporter portal
- `https://ops.sol-ventures.com` for the investigator portal
- `https://api.speak.sol-ventures.com` for the backend API

This keeps the public-facing reporting flow separate from the investigator workspace, and avoids overloading the main website.

## Recommended cPanel Shape

### Static frontends

- `speak.sol-ventures.com` should point to its own document root
- `ops.sol-ventures.com` should point to its own document root
- each frontend deploys only built Vite assets
- both frontends already include `public/.htaccess` for SPA routing on cPanel

### Node API

- `api.speak.sol-ventures.com` should be created as a separate subdomain or app endpoint
- the API should be hosted as a Node.js application in cPanel Application Manager
- file manager alone is enough for uploading files, but it is not enough by itself to run the API unless your cPanel account also includes the Node.js app feature

## Frontend GitHub Actions Workflows

This repo now includes:

- `.github/workflows/deploy-reporter-cpanel.yml`
- `.github/workflows/deploy-investigator-cpanel.yml`

They follow the same model as PAES:

1. install dependencies
2. build the specific Vite app
3. upload only the built `dist/` folder to the cPanel document root through FTPS

## GitHub Secrets

### Shared cPanel FTPS secrets

- `CPANEL_FTP_SERVER`
- `CPANEL_FTP_USERNAME`
- `CPANEL_FTP_PASSWORD`
- `CPANEL_FTP_PORT`

### Reporter portal secrets

- `REPORTER_VITE_API_BASE_URL`
- `REPORTER_CPANEL_REMOTE_DIR`

Recommended values:

- `REPORTER_VITE_API_BASE_URL=https://api.speak.sol-ventures.com`
- `REPORTER_CPANEL_REMOTE_DIR=/public_html/speak/`

If your FTP account is already scoped directly to the reporter subdomain root, use:

- `REPORTER_CPANEL_REMOTE_DIR=/`

### Investigator portal secrets

- `INVESTIGATOR_VITE_API_BASE_URL`
- `INVESTIGATOR_VITE_INVESTIGATOR_ENTRA_TENANT_ID`
- `INVESTIGATOR_VITE_INVESTIGATOR_ENTRA_CLIENT_ID`
- `INVESTIGATOR_VITE_INVESTIGATOR_API_SCOPE`
- `INVESTIGATOR_CPANEL_REMOTE_DIR`

Recommended values:

- `INVESTIGATOR_VITE_API_BASE_URL=https://api.speak.sol-ventures.com`
- `INVESTIGATOR_CPANEL_REMOTE_DIR=/public_html/ops/`

If your FTP account is already scoped directly to the investigator subdomain root, use:

- `INVESTIGATOR_CPANEL_REMOTE_DIR=/`

## Reporter Portal DNS and Hosting

1. Create subdomain `speak.sol-ventures.com`
2. Assign a dedicated document root
   Example:
   - `public_html/speak/`
3. Enable SSL
4. Let GitHub Actions deploy `apps/reporter-portal/dist/`

## Investigator Portal DNS and Hosting

1. Create subdomain `ops.sol-ventures.com`
2. Assign a dedicated document root
   Example:
   - `public_html/ops/`
3. Enable SSL
4. Let GitHub Actions deploy `apps/investigator-portal/dist/`

## Investigator Entra Production Settings

Add this production redirect URI to the investigator portal app registration:

- `https://ops.sol-ventures.com`

Make sure the existing API scope remains granted:

- `api://5e2890bd-62b5-4492-a93a-cce9c44277f7/investigator.read`

## API Hosting in cPanel

The API is prepared to run as a standard Node.js app from:

- `apps/api/app.js`

### Files to upload for the API app

Upload the contents of `apps/api/` to the application directory you will use in cPanel, including:

- `app.js`
- `dist/`
- `package.json`
- `.env` if you want app-local environment loading

Do not upload `node_modules/`.

### API runtime setup

1. Create the Node.js application in cPanel Application Manager
2. Set the application root to the uploaded API folder
3. Set the startup file to:
   - `app.js`
4. Run:
   - `npm install --omit=dev`
5. Restart the application

### API environment variables

At minimum, configure:

- `DATAVERSE_MODE=live`
- `DATAVERSE_URL`
- `DATAVERSE_TENANT_ID`
- `DATAVERSE_CLIENT_ID`
- `DATAVERSE_CLIENT_SECRET`
- `DATAVERSE_CASES_LOGICAL_NAME`
- `DATAVERSE_CASES_ENTITY_SET`
- `DATAVERSE_AUDIT_ENTITY_SET`
- all required `DATAVERSE_*_FIELD` mappings
- `REPORTER_PORTAL_URL=https://speak.sol-ventures.com`
- `INVESTIGATOR_PORTAL_URL=https://ops.sol-ventures.com`
- `CORS_ALLOWED_ORIGINS=https://speak.sol-ventures.com,https://ops.sol-ventures.com`

For email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

For investigator access:

- `INVESTIGATOR_AUTH_ENABLED=true`
- `INVESTIGATOR_ENTRA_TENANT_ID=3427e2ad-ba6d-4100-aec4-f3f18e4b32d1`
- `INVESTIGATOR_API_AUDIENCES=5e2890bd-62b5-4492-a93a-cce9c44277f7,api://5e2890bd-62b5-4492-a93a-cce9c44277f7`
- `INVESTIGATOR_ALLOWED_GROUP_IDS=48163035-5ff8-4b19-b924-bd769f14dade`

## Important Notes

- The frontends are static deployments, just like PAES
- The API is not static and should not be uploaded into `public_html` as if it were a website
- If a portal route returns `404` on refresh, the most common issue is the subdomain document root or `.htaccess`
- If the API works from Postman but fails in-browser, the most common issue is missing production CORS origins
