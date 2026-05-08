import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AppConfig } from "../config/appConfig";

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function buildAcceptedIssuers(tenantId: string) {
  return [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://login.microsoftonline.com/${tenantId}/v2.0/`,
    `https://login.microsoftonline.com/${tenantId}/`,
    `https://sts.windows.net/${tenantId}/`
  ];
}

export function createInvestigatorAuthMiddleware(
  config: AppConfig["investigatorAuth"]
) {
  if (!config.enabled) {
    return (_request: Request, _response: Response, next: NextFunction) => {
      next();
    };
  }

  const acceptedIssuers = buildAcceptedIssuers(config.tenantId!);
  const jwks = createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${config.tenantId}/discovery/v2.0/keys`)
  );

  return async (request: Request, response: Response, next: NextFunction) => {
    if (!config.configured) {
      response.status(503).json({
        message: "Investigator authentication is enabled but not fully configured."
      });
      return;
    }

    if (!config.authorizationConfigured) {
      response.status(503).json({
        message:
          "Investigator authentication is enabled but no allowed users, groups, or roles are configured."
      });
      return;
    }

    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith("Bearer ")) {
      response.status(401).json({
        message: "Missing investigator access token."
      });
      return;
    }

    const accessToken = authorizationHeader.slice("Bearer ".length).trim();

    try {
      const { payload } = await jwtVerify(accessToken, jwks, {
        issuer: acceptedIssuers,
        audience: config.audiences
      });

      const userObjectId = typeof payload.oid === "string" ? payload.oid : null;
      const groupIds = readStringArray(payload.groups);
      const roleValues = readStringArray(payload.roles);
      const isAuthorized =
        (userObjectId !== null &&
          config.allowedUserOids.includes(userObjectId)) ||
        groupIds.some((groupId) => config.allowedGroupIds.includes(groupId)) ||
        roleValues.some((roleValue) =>
          config.allowedRoleValues.includes(roleValue)
        );

      if (!isAuthorized) {
        response.status(403).json({
          message: "Signed-in user is not authorized for investigator access."
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Investigator token verification failed.", error);
      response.status(401).json({
        message: "Invalid or expired investigator access token."
      });
    }
  };
}
