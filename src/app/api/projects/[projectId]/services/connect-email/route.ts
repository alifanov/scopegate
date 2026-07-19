import { NextResponse } from "next/server";
import { withProjectAuth } from "@/lib/project-access";
import { connectEmailAccount, ServiceConnectError } from "@/lib/service-connect";

// POST /api/projects/[projectId]/services/connect-email
export const POST = withProjectAuth<{ projectId: string }>(
  "owner",
  async (request, { params: { projectId } }) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const {
      email,
      password,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      imapSecure,
      smtpSecure,
    } = body as {
      email?: string;
      password?: string;
      imapHost?: string;
      imapPort?: number;
      smtpHost?: string;
      smtpPort?: number;
      imapSecure?: boolean;
      smtpSecure?: boolean;
    };

    if (!email || !password || !imapHost || !smtpHost) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, imapHost, smtpHost" },
        { status: 400 }
      );
    }

    try {
      await connectEmailAccount({
        projectId,
        email,
        password,
        imapHost,
        imapPort,
        smtpHost,
        smtpPort,
        imapSecure,
        smtpSecure,
      });
    } catch (err) {
      if (err instanceof ServiceConnectError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  }
);
