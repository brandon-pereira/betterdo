import { Hono } from "hono";
import { createMcpHandler, originValidationResponse } from "@modelcontextprotocol/server";
import { requireMcpAuth } from "@better-auth/mcp";
import { auth, MCP_RESOURCE, MCP_SCOPE } from "../auth.js";
import { getNotifier } from "../notifier.js";
import config from "../config.js";
import { createBetterDoMcpServer } from "../mcp/server.js";
import { getUserFromAuthInfo, resolveMcpAuthInfo } from "../mcp/context.js";
import { hasMcpSession } from "../services/mcpSessions.js";

// Stateless Streamable HTTP endpoint (MCP 2026-07-28, with the SDK's stateless
// fallback for 2025-era clients). No sessions: every request gets a fresh
// server built for the authenticated user.
const handler = createMcpHandler(
  ({ authInfo }) => createBetterDoMcpServer({ user: getUserFromAuthInfo(authInfo), notifier: getNotifier() }),
  { onerror: err => console.error("[api] mcp:", err) }
);

const resourceMetadataUrl = new URL(
  `/.well-known/oauth-protected-resource${new URL(MCP_RESOURCE).pathname}`,
  MCP_RESOURCE
).toString();

// 401 with an RFC 6750/9728 challenge so the client discards the token and
// starts a fresh authorization.
const unauthorized = (message: string) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${resourceMetadataUrl}", error="invalid_token", error_description="${message}"`
    }
  });

// Verifies the OAuth access token (signature via JWKS, issuer, audience = this
// resource, expiry, DPoP when bound) and the `tasks` scope. Failures get a 401/403
// with an RFC 9728 WWW-Authenticate challenge so clients can start or step up
// the OAuth flow.
const protectedHandler = requireMcpAuth(
  auth,
  async (request, claims) => {
    const authInfo = await resolveMcpAuthInfo(request, claims, new URL(MCP_RESOURCE));
    if (!authInfo) return unauthorized("Access token is not associated with a BetterDo user");
    // JWT access tokens can't be recalled, so a disconnected app's token would stay
    // valid until it expires. Require the user's approval to still exist.
    if (!(await hasMcpSession(getUserFromAuthInfo(authInfo).id, authInfo.clientId))) {
      return unauthorized("This app was disconnected from BetterDo");
    }
    return handler.fetch(request, { authInfo });
  },
  { resource: MCP_RESOURCE, requiredScopes: [MCP_SCOPE], challengeScopes: [MCP_SCOPE, "offline_access"] }
);

// Browsers always send Origin; reject cross-site browser requests (DNS
// rebinding / CSRF). Native MCP clients send no Origin and pass through.
const allowedOrigins = [new URL(config.APP_URL).hostname, new URL(config.SERVER_URL).hostname];

const mcpApi = new Hono();

mcpApi.all("/", c => originValidationResponse(c.req.raw, allowedOrigins) ?? protectedHandler(c.req.raw));

export default mcpApi;
