import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import {
  listOAuthApps,
  saveOAuthApp,
  deleteOAuthApp,
} from "@/lib/oauth-app-credentials";
import { getOAuthRedirectUri } from "@/lib/oauth-credentials";
import { isCloud } from "@/lib/cloud";

// GET /api/projects/[projectId]/oauth-apps — which credential groups are set.
// Deliberately returns no secrets: only the group, the client id and the
// redirect URI the user must whitelist in their own app.
//
// `cloud` rides along because the connections tab is a client component and
// cannot read the server-only flag itself; it needs both to decide whether to
// ask for credentials before starting an OAuth redirect.
export const GET = withProjectAuth<{ projectId: string }>(
  "member",
  async (_request, { params: { projectId } }) => {
    const apps = await listOAuthApps(projectId);
    return NextResponse.json({
      cloud: isCloud(),
      // Template for groups with no row yet. Server-derived from
      // BETTER_AUTH_URL so it matches byte-for-byte what the callback sends;
      // window.location.origin would drift behind a proxy or custom domain.
      redirectUriTemplate: getOAuthRedirectUri("{group}"),
      apps: apps.map((app) => ({
        ...app,
        redirectUri: getOAuthRedirectUri(app.appGroup),
      })),
    });
  }
);

export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    const { appGroup, clientId, clientSecret } = await request.json();
    const app = await saveOAuthApp({ projectId, appGroup, clientId, clientSecret });
    return NextResponse.json({ app }, { status: 201 });
  }
);

export const DELETE = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    const appGroup = new URL(request.url).searchParams.get("appGroup");
    if (!appGroup) {
      return NextResponse.json({ error: "appGroup is required" }, { status: 400 });
    }
    await deleteOAuthApp(projectId, appGroup);
    return NextResponse.json({ success: true });
  }
);
