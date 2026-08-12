import { Resend } from "resend";

// Transactional email. Only the cloud deployment sends any: self-hosted
// onboarding goes through admin-generated invite links, which need no mail.
//
// The client is created lazily so that a self-hosted instance without
// RESEND_API_KEY never constructs it, and so tests can inject their own.

export type EmailSender = {
  send(input: { to: string; subject: string; html: string; text: string }): Promise<void>;
};

let cached: EmailSender | null = null;

function resendSender(): EmailSender {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error(
      "Email is not configured — set RESEND_API_KEY and EMAIL_FROM to enable magic-link sign-in",
    );
  }
  const resend = new Resend(apiKey);
  return {
    async send({ to, subject, html, text }) {
      const { error } = await resend.emails.send({ from, to, subject, html, text });
      if (error) {
        throw new Error(`Resend rejected the message: ${error.message}`);
      }
    },
  };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(
  input: { to: string; subject: string; html: string; text: string },
  { sender }: { sender?: EmailSender } = {},
): Promise<void> {
  const target = sender ?? (cached ??= resendSender());
  await target.send(input);
}
