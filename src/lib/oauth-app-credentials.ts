import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { AuthError } from "@/lib/auth-middleware";
import { PROVIDER_REGISTRY, getCredentialGroup } from "@/lib/provider-registry";

// CRUD for a project's own OAuth application credentials. The client secret is
// encrypted with the same AES-256-GCM helper that protects access tokens, and
// is never read back out to the client.

export class OAuthAppCredentialError extends AuthError {}

type CredentialDb = {
  providerCredential: {
    findMany: typeof db.providerCredential.findMany;
    upsert: typeof db.providerCredential.upsert;
    deleteMany: typeof db.providerCredential.deleteMany;
  };
};

type Deps = { database?: CredentialDb; encrypt?: typeof encrypt };

/** Groups that actually exist in the registry — guards against a client
 *  posting an arbitrary group string. */
function isKnownGroup(group: string): boolean {
  return PROVIDER_REGISTRY.some((def) => getCredentialGroup(def.key) === group);
}

/** Never returns secrets — only which groups are configured, for the UI. */
export async function listOAuthApps(
  projectId: string,
  { database = db }: { database?: CredentialDb } = {},
): Promise<Array<{ appGroup: string; clientId: string; updatedAt: Date }>> {
  return database.providerCredential.findMany({
    where: { projectId },
    select: { appGroup: true, clientId: true, updatedAt: true },
    orderBy: { appGroup: "asc" },
  });
}

export async function saveOAuthApp(
  input: { projectId: string; appGroup: string; clientId: string; clientSecret: string },
  { database = db, encrypt: encryptFn = encrypt }: Deps = {},
): Promise<{ appGroup: string; clientId: string }> {
  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim();

  if (!isKnownGroup(input.appGroup)) {
    throw new OAuthAppCredentialError(`Unknown OAuth app group "${input.appGroup}"`, 400);
  }
  if (!clientId || !clientSecret) {
    throw new OAuthAppCredentialError("Client ID and client secret are required", 400);
  }

  const encrypted = encryptFn(clientSecret);
  const row = await database.providerCredential.upsert({
    where: { projectId_appGroup: { projectId: input.projectId, appGroup: input.appGroup } },
    create: {
      projectId: input.projectId,
      appGroup: input.appGroup,
      clientId,
      clientSecret: encrypted,
    },
    update: { clientId, clientSecret: encrypted },
    select: { appGroup: true, clientId: true },
  });

  return row;
}

export async function deleteOAuthApp(
  projectId: string,
  appGroup: string,
  { database = db }: { database?: CredentialDb } = {},
): Promise<void> {
  const { count } = await database.providerCredential.deleteMany({
    where: { projectId, appGroup },
  });
  if (count === 0) {
    throw new OAuthAppCredentialError("No credentials registered for that group", 404);
  }
}
