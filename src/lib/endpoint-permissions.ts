import { db } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { generateMcpApiKey } from "@/lib/mcp/api-keys";
import { ALL_ACTIONS } from "@/lib/mcp/permissions";
import { requireProjectServiceConnection } from "@/lib/project-access";

type EndpointDatabase = {
  serviceConnection: Pick<typeof db.serviceConnection, "findFirst">;
  mcpEndpoint: Pick<
    typeof db.mcpEndpoint,
    "create" | "findFirst" | "findUnique" | "update"
  >;
  endpointPermission: Pick<
    typeof db.endpointPermission,
    "deleteMany" | "createMany"
  >;
};

type TransactionRunner = <T>(
  fn: (tx: EndpointDatabase) => Promise<T>
) => Promise<T>;

async function defaultTransaction<T>(
  fn: (tx: EndpointDatabase) => Promise<T>
): Promise<T> {
  return db.$transaction((tx) => fn(tx));
}

export class EndpointPermissionError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EndpointPermissionError";
    this.status = status;
  }
}

export type CreateEndpointInput = {
  projectId: string;
  name: string;
  serviceConnectionId: string;
  permissions?: string[];
  rateLimitPerMinute?: number;
};

export type UpdateEndpointInput = {
  projectId: string;
  endpointId: string;
  name?: string;
  isActive?: boolean;
  rateLimitPerMinute?: number;
  permissions?: string[];
};

type ServiceOptions = {
  database?: EndpointDatabase;
  audit?: typeof recordAudit;
  apiKeyGenerator?: typeof generateMcpApiKey;
  transaction?: TransactionRunner;
};

export function validateEndpointPermissions(permissions?: string[]): void {
  if (!permissions) return;

  const invalid = permissions.filter((action) => !ALL_ACTIONS.includes(action));
  if (invalid.length > 0) {
    throw new EndpointPermissionError(
      `Invalid permissions: ${invalid.join(", ")}`,
      400
    );
  }
}

export async function createProjectEndpoint(
  input: CreateEndpointInput,
  {
    database = db,
    audit = recordAudit,
    apiKeyGenerator = generateMcpApiKey,
  }: ServiceOptions = {}
) {
  validateEndpointPermissions(input.permissions);

  try {
    await requireProjectServiceConnection(
      input.projectId,
      input.serviceConnectionId,
      database.serviceConnection
    );
  } catch {
    throw new EndpointPermissionError("Service connection not found", 404);
  }

  const rateLimitPerMinute = input.rateLimitPerMinute ?? 60;
  const endpoint = await database.mcpEndpoint.create({
    data: {
      name: input.name,
      apiKey: apiKeyGenerator(),
      projectId: input.projectId,
      serviceConnectionId: input.serviceConnectionId,
      rateLimitPerMinute,
      permissions: {
        create:
          input.permissions?.map((action) => ({
            action,
          })) ?? [],
      },
    },
    include: { permissions: true },
  });

  await audit({
    endpointId: endpoint.id,
    projectId: input.projectId,
    action: "endpoint:create",
    params: {
      endpointId: endpoint.id,
      name: input.name,
      serviceConnectionId: input.serviceConnectionId,
      permissions: input.permissions,
      rateLimitPerMinute,
    },
    status: "success",
  });

  return endpoint;
}

export async function applyEndpointPermissions(
  input: UpdateEndpointInput,
  {
    database = db,
    audit = recordAudit,
    transaction = defaultTransaction,
  }: ServiceOptions = {}
) {
  const existing = await database.mcpEndpoint.findFirst({
    where: { id: input.endpointId, projectId: input.projectId },
  });
  if (!existing) {
    throw new EndpointPermissionError("Not found", 404);
  }

  validateEndpointPermissions(input.permissions);

  // A partial failure here (e.g. after deleteMany but before createMany)
  // would leave the endpoint with zero permissions — keep update +
  // deleteMany + createMany atomic.
  await transaction(async (tx) => {
    await tx.mcpEndpoint.update({
      where: { id: input.endpointId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.rateLimitPerMinute !== undefined && {
          rateLimitPerMinute: input.rateLimitPerMinute,
        }),
      },
    });

    if (input.permissions) {
      await tx.endpointPermission.deleteMany({
        where: { endpointId: input.endpointId },
      });
      await tx.endpointPermission.createMany({
        data: input.permissions.map((action) => ({
          action,
          endpointId: input.endpointId,
        })),
      });
    }
  });

  const updated = await database.mcpEndpoint.findUnique({
    where: { id: input.endpointId },
    include: { permissions: true },
  });

  await audit({
    endpointId: input.endpointId,
    projectId: input.projectId,
    action: "endpoint:update",
    params: {
      endpointId: input.endpointId,
      name: input.name,
      isActive: input.isActive,
      rateLimitPerMinute: input.rateLimitPerMinute,
      permissions: input.permissions,
    },
    status: "success",
  });

  return updated;
}
