import { encrypt } from "@/lib/crypto";
import { isApiKeyProvider, SERVICE_KEY_VALIDATORS, type ApiKeyValidator } from "@/lib/service-key-validators";
import { validateEmailConnection } from "@/lib/mcp/email";
import { upsertServiceConnection } from "@/lib/service-connection";

export class ServiceConnectError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ServiceConnectError";
    this.status = status;
  }
}

export type ConnectApiKeyInput = {
  projectId: string;
  provider: string;
  apiKey: string;
  label?: string;
};

type ConnectApiKeyOptions = {
  validators?: Record<string, ApiKeyValidator>;
  encrypt?: typeof encrypt;
};

export async function connectApiKey(
  input: ConnectApiKeyInput,
  { validators = SERVICE_KEY_VALIDATORS, encrypt: encryptFn = encrypt }: ConnectApiKeyOptions = {}
) {
  if (!isApiKeyProvider(input.provider)) {
    throw new ServiceConnectError("Unsupported provider", 400);
  }

  const validation = await validators[input.provider](input.apiKey);
  if (!validation.valid) {
    throw new ServiceConnectError("Invalid API key", 422);
  }

  const accountEmail = input.label || validation.label || "API Key";

  return upsertServiceConnection({
    projectId: input.projectId,
    provider: input.provider,
    accountEmail,
    accessToken: encryptFn(input.apiKey),
    refreshToken: null,
  });
}

export type ConnectEmailInput = {
  projectId: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort?: number;
  smtpHost: string;
  smtpPort?: number;
  imapSecure?: boolean;
  smtpSecure?: boolean;
};

type ConnectEmailOptions = {
  validateConnection?: typeof validateEmailConnection;
  encrypt?: typeof encrypt;
};

export async function connectEmailAccount(
  input: ConnectEmailInput,
  { validateConnection = validateEmailConnection, encrypt: encryptFn = encrypt }: ConnectEmailOptions = {}
) {
  const imapPort = input.imapPort || 993;
  const smtpPort = input.smtpPort || 465;
  const imapSecure = input.imapSecure !== false;
  const smtpSecure = input.smtpSecure !== false;

  const validation = await validateConnection({
    imapHost: input.imapHost,
    imapPort,
    smtpHost: input.smtpHost,
    smtpPort,
    username: input.email,
    password: input.password,
    imapSecure,
    smtpSecure,
  });

  if (!validation.valid) {
    throw new ServiceConnectError(validation.error || "Connection failed", 422);
  }

  return upsertServiceConnection({
    projectId: input.projectId,
    provider: "email",
    accountEmail: input.email,
    accessToken: encryptFn(input.password),
    refreshToken: null,
    metadata: {
      imapHost: input.imapHost,
      imapPort,
      imapSecure,
      smtpHost: input.smtpHost,
      smtpPort,
      smtpSecure,
    },
  });
}
