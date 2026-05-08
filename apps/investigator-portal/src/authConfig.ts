import type { Configuration, RedirectRequest } from "@azure/msal-browser";
import { PublicClientApplication } from "@azure/msal-browser";

const tenantId = import.meta.env.VITE_INVESTIGATOR_ENTRA_TENANT_ID;
const clientId = import.meta.env.VITE_INVESTIGATOR_ENTRA_CLIENT_ID;
const apiScope = import.meta.env.VITE_INVESTIGATOR_API_SCOPE;

export const investigatorAuthConfigured = Boolean(
  tenantId && clientId && apiScope
);

export const investigatorLoginRequest: RedirectRequest = {
  scopes: apiScope ? [apiScope] : []
};

export const investigatorMsalConfig: Configuration | null =
  investigatorAuthConfigured
    ? {
        auth: {
          authority: `https://login.microsoftonline.com/${tenantId}`,
          clientId,
          redirectUri: window.location.origin
        },
        cache: {
          cacheLocation: "sessionStorage"
        }
      }
    : null;

export const investigatorMsalInstance = investigatorMsalConfig
  ? new PublicClientApplication(investigatorMsalConfig)
  : null;
