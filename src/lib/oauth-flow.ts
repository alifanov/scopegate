import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-middleware";
import { parseAndVerifyState, parseCookieValue } from "@/lib/oauth-state";
import { encrypt } from "@/lib/crypto";
import { createId } from "@paralleldrive/cuid2";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// ─── Start ────────────────────────────────────────────────────────────────────

export interface OAuthStartOpts {
  buildUrl: (projectId: string, csrfToken: string) => string;
  extraCookies?: Array<{ name: string; value: string }>;
}

export async function handleOAuthStart(
  request: Request,
  opts: OAuthStartOpts,
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const csrfToken = crypto.randomUUID();
  const url = opts.buildUrl(projectId, csrfToken);

  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_csrf", csrfToken, { ...COOKIE_OPTS, maxAge: 600 });
  for (const { name, value } of opts.extraCookies ?? []) {
    response.cookies.set(name, value, { ...COOKIE_OPTS, maxAge: 600 });
  }

  return response;
}

// ─── Callback ─────────────────────────────────────────────────────────────────

export interface OAuthTokenResult {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number | null;
  id_token?: string | null;
}

export interface OAuthConnectionData {
  accountEmail: string;
  expiresAt?: Date | null;
  refreshToken?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface OAuthCallbackContext {
  code: string;
  projectId: string;
  provider: string;
  user: { userId: string; email: string };
  extras: Record<string, string>;
  baseUrl: string;
}

interface PersistParams {
  projectId: string;
  provider: string;
  connectionData: OAuthConnectionData;
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
}

interface AfterPersistParams<T extends OAuthTokenResult> {
  connectionId: string;
  tokens: T;
  connectionData: OAuthConnectionData;
  ctx: OAuthCallbackContext;
  clearAndRedirect: (url: string) => NextResponse;
}

export interface OAuthCallbackOpts<T extends OAuthTokenResult = OAuthTokenResult> {
  expectedProvider: string | readonly string[];
  exchange: (code: string, ctx: OAuthCallbackContext) => Promise<T>;
  getConnectionData: (tokens: T, ctx: OAuthCallbackContext) => Promise<OAuthConnectionData>;
  extraCookiesToRead?: string[];
  extraCookiesToClear?: string[];
  persist?: (params: PersistParams) => Promise<string>;
  afterPersist?: (params: AfterPersistParams<T>) => Promise<NextResponse | null>;
}

export async function persistOAuthConnection({
  projectId,
  provider,
  connectionData,
  encryptedAccessToken,
  encryptedRefreshToken,
}: PersistParams): Promise<string> {
  const { accountEmail, metadata } = connectionData;
  const expiresAt = connectionData.expiresAt ?? null;
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  const lockKey = `${projectId}:${provider}:${accountEmail}`;
  const newId = createId();

  const result = await db.$queryRaw<{ id: string }[]>`
    WITH lock AS (
      SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    ),
    updated AS (
      UPDATE "ServiceConnection"
      SET
        "accessToken" = ${encryptedAccessToken},
        "refreshToken" = ${encryptedRefreshToken},
        "expiresAt" = ${expiresAt},
        "metadata" = COALESCE(${metadataJson}::jsonb, "ServiceConnection"."metadata"),
        "status" = 'active',
        "lastError" = NULL,
        "updatedAt" = NOW()
      FROM lock
      WHERE
        "projectId" = ${projectId}
        AND "provider" = ${provider}
        AND "accountEmail" = ${accountEmail}
      RETURNING "ServiceConnection"."id"
    ),
    inserted AS (
      INSERT INTO "ServiceConnection" (
        "id",
        "projectId",
        "provider",
        "accountEmail",
        "accessToken",
        "refreshToken",
        "expiresAt",
        "metadata",
        "status",
        "createdAt",
        "updatedAt"
      )
      SELECT
        ${newId},
        ${projectId},
        ${provider},
        ${accountEmail},
        ${encryptedAccessToken},
        ${encryptedRefreshToken},
        ${expiresAt},
        ${metadataJson}::jsonb,
        'active',
        NOW(),
        NOW()
      FROM lock
      WHERE NOT EXISTS (SELECT 1 FROM updated)
      RETURNING "id"
    )
    SELECT "id" FROM updated
    UNION ALL
    SELECT "id" FROM inserted
    LIMIT 1
  `;

  return result[0].id;
}

async function defaultPersist(params: PersistParams): Promise<string> {
  return persistOAuthConnection(params);
}

export async function handleOAuthCallback<T extends OAuthTokenResult = OAuthTokenResult>(
  request: Request,
  opts: OAuthCallbackOpts<T>,
): Promise<NextResponse> {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }
  if (!code || !stateParam) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  let state: { projectId: string; provider: string; csrfToken: string };
  try {
    state = parseAndVerifyState(stateParam);
  } catch {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const { projectId, provider, csrfToken } = state;
  const expected =
    typeof opts.expectedProvider === "string"
      ? [opts.expectedProvider]
      : (opts.expectedProvider as string[]);

  if (!projectId || !expected.includes(provider) || !csrfToken) {
    return NextResponse.redirect(`${baseUrl}/projects?error=oauth_failed`);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const csrfValue = parseCookieValue(cookieHeader, "oauth_csrf");
  if (!csrfValue || csrfValue !== csrfToken) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`,
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const member = await db.teamMember.findUnique({
    where: { userId_projectId: { userId: user.userId, projectId } },
  });
  if (!member) {
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`,
    );
  }

  const extras: Record<string, string> = {};
  for (const name of opts.extraCookiesToRead ?? []) {
    const val = parseCookieValue(cookieHeader, name);
    if (!val) {
      return NextResponse.redirect(
        `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`,
      );
    }
    extras[name] = val;
  }

  const ctx: OAuthCallbackContext = { code, projectId, provider, user, extras, baseUrl };

  const clearAndRedirect = (url: string): NextResponse => {
    const r = NextResponse.redirect(url);
    r.cookies.set("oauth_csrf", "", { ...COOKIE_OPTS, maxAge: 0 });
    for (const name of opts.extraCookiesToClear ?? []) {
      r.cookies.set(name, "", { ...COOKIE_OPTS, maxAge: 0 });
    }
    return r;
  };

  try {
    const tokens = await opts.exchange(code, ctx);
    const connectionData = await opts.getConnectionData(tokens, ctx);

    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = connectionData.refreshToken
      ? encrypt(connectionData.refreshToken)
      : null;

    const persistFn = opts.persist ?? defaultPersist;
    const connectionId = await persistFn({
      projectId,
      provider,
      connectionData,
      encryptedAccessToken,
      encryptedRefreshToken,
    });

    if (opts.afterPersist) {
      const result = await opts.afterPersist({
        connectionId,
        tokens,
        connectionData,
        ctx,
        clearAndRedirect,
      });
      if (result) return result;
    }

    return clearAndRedirect(`${baseUrl}/projects/${projectId}?tab=services`);
  } catch (err) {
    console.error(`[ScopeGate] OAuth callback error for ${provider}:`, err);
    return NextResponse.redirect(
      `${baseUrl}/projects/${projectId}?tab=services&error=oauth_failed`,
    );
  }
}
