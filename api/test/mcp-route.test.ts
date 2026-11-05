import { describe, test, expect, vi } from "vitest";

// routes/mcp.ts loads the real auth config, which requires these. The db itself
// is mocked (see helpers/setup.ts), so the values are never used to connect.
vi.hoisted(() => {
  process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
  process.env.GOOGLE_CLIENT_ID ??= "test";
  process.env.GOOGLE_CLIENT_SECRET ??= "test";
});

import createRouter from "./helpers/createRouter.js";
import { resolveMcpAuthInfo, getUserFromAuthInfo } from "../src/mcp/context.js";
import mcpApi from "../src/routes/mcp.js";
import config from "../src/config.js";

const resource = new URL("http://test.local/api/mcp");

const initializeRequest = (headers: Record<string, string> = {}) =>
  mcpApi.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
  });

describe("MCP route", () => {
  test("Rejects requests without an access token with an OAuth challenge", async () => {
    const res = await initializeRequest();

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toMatch(/resource_metadata=/);
  });

  test("Rejects an invalid access token", async () => {
    const res = await initializeRequest({ Authorization: "Bearer not-a-real-token" });

    expect(res.status).toBe(401);
  });

  test("Rejects cross-site browser requests before authentication", async () => {
    const res = await initializeRequest({ Origin: "https://evil.example" });

    expect(res.status).toBe(403);
    expect(res.headers.get("WWW-Authenticate")).toBeNull();
  });

  test("Allows browser requests from the app's origin through to authentication", async () => {
    const res = await initializeRequest({ Origin: new URL(config.APP_URL).origin });

    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toMatch(/resource_metadata=/);
  });
});

describe("MCP access token resolution", () => {
  const request = (authorization = "Bearer abc.def.ghi") =>
    new Request(resource, { method: "POST", headers: { Authorization: authorization } });

  test("Resolves a user's token to auth info carrying that user", async () => {
    const router = await createRouter();

    const authInfo = await resolveMcpAuthInfo(
      request(),
      { sub: router.user.id, azp: "client-123", scope: "tasks offline_access", exp: 1_900_000_000 },
      resource
    );

    expect(authInfo).not.toBeNull();
    expect(getUserFromAuthInfo(authInfo!).id).toBe(router.user.id);
    expect(authInfo).toMatchObject({
      token: "abc.def.ghi",
      clientId: "client-123",
      scopes: ["tasks", "offline_access"],
      expiresAt: 1_900_000_000,
      resource
    });
  });

  test("Strips the DPoP scheme from the token", async () => {
    const router = await createRouter();

    const authInfo = await resolveMcpAuthInfo(request("DPoP xyz"), { sub: router.user.id }, resource);

    expect(authInfo?.token).toBe("xyz");
  });

  test("Returns null when the subject is not a BetterDo user", async () => {
    // Client-credentials tokens use the client ID as the subject.
    const authInfo = await resolveMcpAuthInfo(request(), { sub: "client-123", azp: "client-123" }, resource);

    expect(authInfo).toBeNull();
  });

  test("Returns null when the token has no subject", async () => {
    const authInfo = await resolveMcpAuthInfo(request(), { azp: "client-123" }, resource);

    expect(authInfo).toBeNull();
  });
});
