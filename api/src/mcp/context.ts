import type { AuthInfo } from "@modelcontextprotocol/server";
import type { Notifier } from "../notifier.js";
import { getUserById } from "../services/users.js";

export interface McpUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  timeZone: string;
  customLists?: Record<string, unknown> | null;
}

export interface McpContext {
  user: McpUser;
  notifier: Notifier;
}

interface TokenDetails {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
}

/** The verified access token claims this server reads (a subset of the JWT payload). */
export interface AccessTokenClaims {
  sub?: string;
  exp?: number;
  [claim: string]: unknown;
}

/**
 * Maps a verified access token to the MCP auth info for its user. Returns null
 * when no BetterDo user is behind the token, e.g. client-credentials tokens,
 * whose `sub` is the client ID, or a user that has since been deleted.
 */
export async function resolveMcpAuthInfo(
  request: Request,
  claims: AccessTokenClaims,
  resource: URL
): Promise<AuthInfo | null> {
  const user = typeof claims.sub === "string" ? await getUserById(claims.sub) : null;
  if (!user) return null;

  return createAuthInfo(user, {
    token: request.headers.get("authorization")?.replace(/^(Bearer|DPoP)\s+/i, "") ?? "",
    clientId: String(claims.client_id ?? claims.azp ?? ""),
    scopes: typeof claims.scope === "string" ? claims.scope.split(" ") : [],
    expiresAt: claims.exp,
    resource
  });
}

// The MCP handler is stateless: every HTTP request builds a fresh server from
// the `authInfo` the route resolved. The authenticated user rides along in
// `authInfo.extra` so tools never deal with tokens directly.
export function createAuthInfo(user: McpUser, details: TokenDetails): AuthInfo {
  return { ...details, extra: { user } };
}

export function getUserFromAuthInfo(authInfo: AuthInfo | undefined): McpUser {
  const user = authInfo?.extra?.user as McpUser | undefined;
  if (!user?.id) {
    throw new Error("MCP request is missing an authenticated user");
  }
  return user;
}
