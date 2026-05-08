# Deploying SVH SpeakUp to cPanel

This rollout is prepared for phase one only:

- `https://speak.sol-ventures.com` for the public reporter portal
- `https://api.speak.sol-ventures.com` for the backend API
- the investigator portal stays out of production for now

## Deployment model

- GitHub is the source of truth
- GitHub Actions builds and deploys the reporter portal and API to cPanel over FTPS
- cPanel Application Manager runs the Node.js API

This is simpler and safer than trying to build the monorepo directly on shared hosting.

## Workflows in this repo

- `.github/workflows/deploy-reporter-cpanel.yml`
- `.github/workflows/deploy-api-cpanel.yml`
- `.github/workflows/deploy-investigator-cpanel.yml`

The investigator workflow is manual-only until phase two.

## Step 1: Prepare cPanel

### 1. Verify the two live domains

In cPanel `Domains`, confirm these exist and keep their current roots:

- `speak.sol-ventures.com` -> `/speak.sol-ventures.com`
- `api.speak.sol-ventures.com` -> `/api.speak.sol-ventures.com`

Do not add redirects between them.

### 2. Fix SSL before enabling HTTPS redirect

The warning icon beside `Force HTTPS Redirect` usually means SSL is not active yet.

In cPanel `SSL/TLS Status`:

1. make sure both domains are included in AutoSSL
2. run AutoSSL
3. wait until both domains show an active certificate

After SSL is active, go back to `Domains` and enable `Force HTTPS Redirect` for:

- `speak.sol-ventures.com`
- `api.speak.sol-ventures.com`

### 3. Confirm Node.js support

You need cPanel `Application Manager` for the API. If your cPanel account does not show it, ask the hosting provider to enable:

- Node.js application support
- Application Manager
- Terminal or SSH access if available

### 4. Create the API application in cPanel

In `Application Manager`, create a Node.js app with:

- Domain: `api.speak.sol-ventures.com`
- Application root: `api.speak.sol-ventures.com`
- Application URL: `/`
- Startup file: `app.js`
- Node.js version: `20` or `22`

Use the same folder as the subdomain root to avoid Passenger and SSL path mismatches.

### 5. Create or choose FTP access

You can use:

- the main cPanel FTP user, or
- dedicated FTP users scoped to each deployment folder

If you use the main cPanel user, these remote directories usually work:

- reporter portal: `/speak.sol-ventures.com/`
- API app: `/api.speak.sol-ventures.com/`

If you create FTP users scoped directly to those folders, use `/` for the corresponding workflow secret.

## Step 2: Add GitHub secrets

In GitHub `Settings -> Secrets and variables -> Actions`, add:

### Shared cPanel FTPS secrets

- `CPANEL_FTP_SERVER`
- `CPANEL_FTP_USERNAME`
- `CPANEL_FTP_PASSWORD`
- `CPANEL_FTP_PORT`

Recommended port:

- `21`

### Reporter portal secrets

- `REPORTER_VITE_API_BASE_URL`
- `REPORTER_CPANEL_REMOTE_DIR`

Recommended values for this rollout:

- `REPORTER_VITE_API_BASE_URL=https://api.speak.sol-ventures.com`
- `REPORTER_CPANEL_REMOTE_DIR=/speak.sol-ventures.com/`

### API secrets

- `API_CPANEL_REMOTE_DIR`

Recommended value:

- `API_CPANEL_REMOTE_DIR=/api.speak.sol-ventures.com/`

## Step 3: Configure API environment variables in cPanel

In `Application Manager`, add the production environment values for the API.

### Minimum required for phase one

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
- `INVESTIGATOR_AUTH_ENABLED=false`

### Optional but recommended

- `DATAVERSE_CATEGORY_OPTION_MAP`
- `DATAVERSE_STATUS_OPTION_MAP`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

You only need `CORS_ALLOWED_ORIGINS` if you want extra origins beyond the reporter portal URL.

## Step 4: First deployment order

### 1. Deploy the API first

Run the `Deploy API to cPanel` GitHub Actions workflow.

That workflow uploads:

- `app.js`
- `package.json`
- `dist/`

After the upload finishes, in cPanel:

1. open `Application Manager`
2. click `Enable Dependencies` or run `npm install --omit=dev`
3. restart the application

### 2. Test the API

Check:

- `https://api.speak.sol-ventures.com/health`

Expected result:

- JSON with `"ok": true`

### 3. Deploy the reporter portal

Run the `Deploy Reporter Portal to cPanel` workflow.

That workflow uploads only the built Vite `dist/` contents to the reporter portal document root.

### 4. Test the reporter portal

Check:

- `https://speak.sol-ventures.com`
- `https://speak.sol-ventures.com/report`
- `https://speak.sol-ventures.com/track`

If a direct refresh on `/report` or `/track` returns `404`, the usual cause is a missing `.htaccess` file or the wrong subdomain root.

## Phase two later

When you are ready for the investigator portal, set up its domain, Entra redirect URI, secrets, and then enable the manual investigator workflow.
