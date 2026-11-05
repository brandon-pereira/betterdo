import { and, desc, eq, inArray, max } from "drizzle-orm";
import { db } from "../db.js";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from "../schema/auth.js";

// An "MCP session" is an MCP client (e.g. an AI assistant) the user has
// authorized through OAuth: one consent per client, plus the tokens issued to it.

export interface McpSession {
  clientId: string;
  name: string | null;
  icon: string | null;
  uri: string | null;
  scopes: string[];
  connectedAt: Date | null;
  lastActiveAt: Date | null;
}

export async function listMcpSessions(userId: string): Promise<McpSession[]> {
  const consents = await db
    .select({
      clientId: oauthConsent.clientId,
      scopes: oauthConsent.scopes,
      createdAt: oauthConsent.createdAt,
      updatedAt: oauthConsent.updatedAt,
      name: oauthClient.name,
      icon: oauthClient.icon,
      uri: oauthClient.uri
    })
    .from(oauthConsent)
    .innerJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(desc(oauthConsent.createdAt));

  if (consents.length === 0) return [];

  // Refresh tokens rotate on every refresh, so the newest one approximates when
  // the client last renewed its access.
  const activity = await db
    .select({ clientId: oauthRefreshToken.clientId, lastIssuedAt: max(oauthRefreshToken.createdAt) })
    .from(oauthRefreshToken)
    .where(
      and(
        eq(oauthRefreshToken.userId, userId),
        inArray(
          oauthRefreshToken.clientId,
          consents.map(consent => consent.clientId)
        )
      )
    )
    .groupBy(oauthRefreshToken.clientId);
  const lastIssuedByClient = new Map(activity.map(row => [row.clientId, row.lastIssuedAt]));

  return consents.map(consent => {
    const lastIssued = lastIssuedByClient.get(consent.clientId) ?? null;
    const candidates = [lastIssued, consent.updatedAt, consent.createdAt].filter((d): d is Date => d instanceof Date);
    return {
      clientId: consent.clientId,
      name: consent.name,
      icon: consent.icon,
      uri: consent.uri,
      scopes: consent.scopes,
      connectedAt: consent.createdAt,
      lastActiveAt: candidates.length ? new Date(Math.max(...candidates.map(d => d.getTime()))) : null
    };
  });
}

/** Whether the user currently authorizes this client. Checked on every MCP request. */
export async function hasMcpSession(userId: string, clientId: string) {
  const [row] = await db
    .select({ id: oauthConsent.id })
    .from(oauthConsent)
    .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Revokes a client's access: removes the consent and every token issued to it
 * for this user. Deleting the consent alone isn't enough, since the refresh
 * grant doesn't check consent. JWT access tokens can't be recalled, so the MCP
 * route also rejects tokens with no matching consent (see routes/mcp.ts).
 * Returns false if the user hadn't authorized the client.
 */
export async function revokeMcpSession(userId: string, clientId: string) {
  return db.transaction(async tx => {
    const deleted = await tx
      .delete(oauthConsent)
      .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
      .returning({ id: oauthConsent.id });
    await tx
      .delete(oauthAccessToken)
      .where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, clientId)));
    await tx
      .delete(oauthRefreshToken)
      .where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)));
    return deleted.length > 0;
  });
}
