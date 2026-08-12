import { db } from "./db";
import { decrypt } from "./crypto";
import { isCloud } from "./cloud";
import { AuthError } from "./auth-middleware";
import {
  getCredentialGroup,
  getProviderDef,
  groupRequiresOwnApp,
} from "./provider-registry";

// Resolves the OAuth application credentials to use for a given provider and
// project — the user's own app when they have registered one, the operator's
// environment variables otherwise.
//
// The point of the distinction: Google's restricted scopes need a CASA audit,
// Meta needs App Review, LinkedIn needs partner approval. None of that can be
// done on a user's behalf, and an unverified shared app caps the whole service
// at 100 users with refresh tokens that expire weekly. Letting the user supply
// their own app sidesteps all of it — and a Google Workspace admin can create
// an "Internal" app that needs no verification whatsoever.

export type OAuthAppCreds = { clientId: string; clientSecret: string };

/** 428 Precondition Required — the caller must register an OAuth app first. */
export class OAuthAppNotConfiguredError extends AuthError {
  constructor(
    message: string,
    public readonly appGroup: string | null,
  ) {
    super(message, 428);
  }
}

type CredentialDb = {
  providerCredential: {
    findUnique: typeof db.providerCredential.findUnique;
  };
};

export type ResolveOAuthAppDeps = {
  database?: CredentialDb;
  decrypt?: (value: string) => string;
  cloud?: boolean;
};

/** The env var names holding the operator's app for a provider. Reads from the
 *  registry rather than a second table, so adding a provider needs no edit. */
function envNamesFor(providerKey: string): { idEnv: string; secretEnv: string } | null {
  const def = getProviderDef(providerKey);
  if (!def) return null;
  if (def.token.kind === "refresh") {
    return { idEnv: def.token.clientIdEnv, secretEnv: def.token.clientSecretEnv };
  }
  if (def.oauthStart) {
    // Providers without a refresh config still name their client id env in
    // oauthStart; the secret follows the provider's own naming, so derive it
    // from the id (…_CLIENT_ID → …_CLIENT_SECRET, …_APP_ID → …_APP_SECRET).
    const idEnv = def.oauthStart.clientIdEnv;
    return { idEnv, secretEnv: idEnv.replace(/_ID$/, "_SECRET") };
  }
  return null;
}

export async function resolveOAuthApp(
  providerKey: string,
  projectId: string,
  { database = db, decrypt: dec = decrypt, cloud = isCloud() }: ResolveOAuthAppDeps = {},
): Promise<OAuthAppCreds> {
  const group = getCredentialGroup(providerKey);

  if (group) {
    const own = await database.providerCredential.findUnique({
      where: { projectId_appGroup: { projectId, appGroup: group } },
      select: { clientId: true, clientSecret: true },
    });
    if (own) {
      return { clientId: own.clientId, clientSecret: dec(own.clientSecret) };
    }
  }

  // On the cloud, providers that need their own app must NOT silently fall back
  // to the operator's — that fallback is exactly what the verification limits
  // make unusable, and it would fail later at the provider's consent screen
  // with a far less actionable error.
  if (cloud && groupRequiresOwnApp(group)) {
    throw new OAuthAppNotConfiguredError(
      `Connecting this service requires your own OAuth application. Add its client ID and secret in project settings.`,
      group,
    );
  }

  const envNames = envNamesFor(providerKey);
  const clientId = envNames && process.env[envNames.idEnv];
  const clientSecret = envNames && process.env[envNames.secretEnv];

  if (!clientId || !clientSecret) {
    throw new OAuthAppNotConfiguredError(
      `No OAuth application configured for "${providerKey}"` +
        (envNames ? ` — set ${envNames.idEnv} and ${envNames.secretEnv}` : ""),
      group,
    );
  }

  return { clientId, clientSecret };
}

/** The redirect URI the user must whitelist in their own OAuth app. Single
 *  owner of this string so the value shown in the UI cannot drift from the one
 *  the callback actually sends. */
export function getOAuthRedirectUri(routeKey: string): string {
  return `${process.env.BETTER_AUTH_URL ?? ""}/api/oauth/${routeKey}/callback`;
}
