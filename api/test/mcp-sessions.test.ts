import { describe, test, expect } from "vitest";
import createRouter from "./helpers/createRouter.js";
import { testDb } from "./helpers/setup.js";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from "../src/schema/auth.js";
import { hasMcpSession, listMcpSessions, revokeMcpSession } from "../src/services/mcpSessions.js";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function createClient(name: string | null = "Claude") {
  const clientId = `client-${uid()}`;
  await testDb.insert(oauthClient).values({ id: uid(), clientId, name, redirectUris: ["https://example.com/cb"] });
  return clientId;
}

async function connect(userId: string, clientId: string, connectedAt = new Date("2026-01-01T00:00:00Z")) {
  await testDb.insert(oauthConsent).values({
    id: uid(),
    clientId,
    userId,
    scopes: ["tasks", "offline_access"],
    createdAt: connectedAt,
    updatedAt: connectedAt
  });
  const refreshId = uid();
  await testDb
    .insert(oauthRefreshToken)
    .values({ id: refreshId, token: uid(), clientId, userId, scopes: ["tasks"], createdAt: connectedAt });
  await testDb
    .insert(oauthAccessToken)
    .values({ id: uid(), token: uid(), clientId, userId, refreshId, scopes: ["tasks"], createdAt: connectedAt });
}

describe("MCP connected apps", () => {
  test("Lists the apps a user has approved, newest first", async () => {
    const { user } = await createRouter();
    const older = await createClient("Cursor");
    const newer = await createClient("Claude");
    await connect(user.id, older, new Date("2026-01-01T00:00:00Z"));
    await connect(user.id, newer, new Date("2026-02-01T00:00:00Z"));

    const sessions = await listMcpSessions(user.id);

    expect(sessions.map(s => [s.clientId, s.name])).toEqual([
      [newer, "Claude"],
      [older, "Cursor"]
    ]);
    expect(sessions[0]).toMatchObject({ scopes: ["tasks", "offline_access"] });
  });

  test("Reports the latest token refresh as last activity", async () => {
    const { user } = await createRouter();
    const clientId = await createClient();
    await connect(user.id, clientId, new Date("2026-01-01T00:00:00Z"));
    const refreshedAt = new Date("2026-03-01T12:00:00Z");
    await testDb
      .insert(oauthRefreshToken)
      .values({ id: uid(), token: uid(), clientId, userId: user.id, scopes: ["tasks"], createdAt: refreshedAt });

    const [session] = await listMcpSessions(user.id);

    expect(session.connectedAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    expect(session.lastActiveAt).toEqual(refreshedAt);
  });

  test("Does not list other users' apps", async () => {
    const owner = await createRouter();
    const other = await createRouter();
    await connect(owner.user.id, await createClient());

    expect(await listMcpSessions(other.user.id)).toEqual([]);
  });

  test("Revoking removes the approval and every token issued to the app", async () => {
    const { user } = await createRouter();
    const clientId = await createClient();
    await connect(user.id, clientId);
    expect(await hasMcpSession(user.id, clientId)).toBe(true);

    expect(await revokeMcpSession(user.id, clientId)).toBe(true);

    expect(await hasMcpSession(user.id, clientId)).toBe(false);
    expect(await listMcpSessions(user.id)).toEqual([]);
    expect(await testDb.query.oauthRefreshToken.findMany({ where: { clientId } })).toEqual([]);
    expect(await testDb.query.oauthAccessToken.findMany({ where: { clientId } })).toEqual([]);
  });

  test("Revoking only affects the requesting user", async () => {
    const owner = await createRouter();
    const other = await createRouter();
    const clientId = await createClient();
    await connect(owner.user.id, clientId);
    await connect(other.user.id, clientId);

    await revokeMcpSession(owner.user.id, clientId);

    expect(await hasMcpSession(other.user.id, clientId)).toBe(true);
  });

  test("Revoking an app the user never approved reports not found", async () => {
    const { user } = await createRouter();
    expect(await revokeMcpSession(user.id, await createClient())).toBe(false);
  });
});
