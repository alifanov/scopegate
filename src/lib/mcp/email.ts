import { ImapFlow, type MessageAddressObject } from "imapflow";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

interface EmailConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
}

async function getEmailConfig(serviceConnectionId: string): Promise<{
  imap: EmailConnectionConfig;
  smtp: SmtpConfig;
  email: string;
}> {
  const connection = await db.serviceConnection.findUniqueOrThrow({
    where: { id: serviceConnectionId },
  });
  const password = decrypt(connection.accessToken);
  const meta = connection.metadata as Record<string, unknown> | null;

  return {
    imap: {
      host: (meta?.imapHost as string) || "",
      port: (meta?.imapPort as number) || 993,
      username: connection.accountEmail,
      password,
      secure: meta?.imapSecure !== false,
    },
    smtp: {
      host: (meta?.smtpHost as string) || "",
      port: (meta?.smtpPort as number) || 465,
      username: connection.accountEmail,
      password,
      secure: meta?.smtpSecure !== false,
    },
    email: connection.accountEmail,
  };
}

function createImapClient(config: EmailConnectionConfig): ImapFlow {
  return new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure !== false,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });
}

export async function emailListMailboxes(serviceConnectionId: string) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const mailboxes = await client.list();
    return mailboxes.map((m) => ({
      path: m.path,
      name: m.name,
      delimiter: m.delimiter,
      flags: Array.from(m.flags || []),
      specialUse: m.specialUse || null,
      listed: m.listed,
    }));
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailListMessages(
  serviceConnectionId: string,
  mailbox: string,
  limit: number = 20,
  page: number = 1
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      const status = client.mailbox;
      if (!status) return { messages: [], total: 0 };
      const total = status.exists || 0;

      if (total === 0) return { messages: [], total: 0 };

      // Calculate range (newest first)
      const end = total - (page - 1) * limit;
      const start = Math.max(1, end - limit + 1);

      if (end < 1) return { messages: [], total, page };

      const messages: Array<Record<string, unknown>> = [];
      for await (const msg of client.fetch(`${start}:${end}`, {
        envelope: true,
        flags: true,
        bodyStructure: true,
        size: true,
      })) {
        messages.push({
          seq: msg.seq,
          uid: msg.uid,
          flags: Array.from(msg.flags || []),
          size: msg.size,
          envelope: {
            date: msg.envelope?.date?.toISOString() || null,
            subject: msg.envelope?.subject,
            from: msg.envelope?.from?.map((a: MessageAddressObject) => ({
              name: a.name,
              address: a.address,
            })),
            to: msg.envelope?.to?.map((a: MessageAddressObject) => ({
              name: a.name,
              address: a.address,
            })),
            messageId: msg.envelope?.messageId,
            inReplyTo: msg.envelope?.inReplyTo,
          },
        });
      }

      // Reverse so newest is first
      messages.reverse();

      return { messages, total, page, limit };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailReadMessage(
  serviceConnectionId: string,
  mailbox: string,
  uid: number
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      const msg = await client.fetchOne(String(uid), {
        envelope: true,
        flags: true,
        source: true,
        size: true,
      }, { uid: true });

      if (!msg) return null;

      // Parse the raw source to extract text/html parts
      const source = msg.source?.toString("utf-8") || "";

      // Simple extraction of body content
      let textBody = "";
      let htmlBody = "";

      // Try to extract text content from the source
      const { simpleParseEmail } = await import("./email-parser");
      const parsed = simpleParseEmail(source);
      textBody = parsed.text;
      htmlBody = parsed.html;

      return {
        uid: msg.uid,
        flags: Array.from(msg.flags || []),
        size: msg.size,
        envelope: {
          date: msg.envelope?.date?.toISOString() || null,
          subject: msg.envelope?.subject,
          from: msg.envelope?.from?.map((a: MessageAddressObject) => ({
            name: a.name,
            address: a.address,
          })),
          to: msg.envelope?.to?.map((a: MessageAddressObject) => ({
            name: a.name,
            address: a.address,
          })),
          cc: msg.envelope?.cc?.map((a: MessageAddressObject) => ({
            name: a.name,
            address: a.address,
          })),
          messageId: msg.envelope?.messageId,
          inReplyTo: msg.envelope?.inReplyTo,
        },
        body: {
          text: textBody,
          html: htmlBody,
        },
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailSearchMessages(
  serviceConnectionId: string,
  mailbox: string,
  query: Record<string, unknown>,
  limit: number = 20
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      // Build search criteria
      const searchCriteria: Record<string, unknown> = {};

      if (query.from) searchCriteria.from = query.from;
      if (query.to) searchCriteria.to = query.to;
      if (query.subject) searchCriteria.subject = query.subject;
      if (query.body) searchCriteria.body = query.body;
      if (query.since) searchCriteria.since = new Date(query.since as string);
      if (query.before) searchCriteria.before = new Date(query.before as string);
      if (query.unseen) searchCriteria.seen = false;
      if (query.flagged) searchCriteria.flagged = true;

      const uids = await client.search(searchCriteria, { uid: true });
      if (!uids) return { messages: [], total: 0 };
      const resultUids = uids.slice(-limit).reverse();

      if (resultUids.length === 0) return { messages: [], total: 0 };

      const messages: Array<Record<string, unknown>> = [];
      for await (const msg of client.fetch(resultUids.join(","), {
        envelope: true,
        flags: true,
        size: true,
      }, { uid: true })) {
        messages.push({
          uid: msg.uid,
          flags: Array.from(msg.flags || []),
          size: msg.size,
          envelope: {
            date: msg.envelope?.date?.toISOString() || null,
            subject: msg.envelope?.subject,
            from: msg.envelope?.from?.map((a: MessageAddressObject) => ({
              name: a.name,
              address: a.address,
            })),
            to: msg.envelope?.to?.map((a: MessageAddressObject) => ({
              name: a.name,
              address: a.address,
            })),
            messageId: msg.envelope?.messageId,
          },
        });
      }

      messages.reverse();

      return { messages, total: uids.length };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailSendMessage(
  serviceConnectionId: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    cc?: string;
    bcc?: string;
    replyTo?: string;
    inReplyTo?: string;
    references?: string;
    html?: boolean;
  }
) {
  const config = await getEmailConfig(serviceConnectionId);
  const { smtp, email } = config;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure !== false,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
  });

  const mailOptions: Record<string, unknown> = {
    from: email,
    to,
    subject,
  };

  if (options?.html) {
    mailOptions.html = body;
  } else {
    mailOptions.text = body;
  }

  if (options?.cc) mailOptions.cc = options.cc;
  if (options?.bcc) mailOptions.bcc = options.bcc;
  if (options?.replyTo) mailOptions.replyTo = options.replyTo;
  if (options?.inReplyTo) mailOptions.inReplyTo = options.inReplyTo;
  if (options?.references) mailOptions.references = options.references;

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

export async function emailMoveMessage(
  serviceConnectionId: string,
  mailbox: string,
  uid: number,
  destination: string
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      await client.messageMove(String(uid), destination, { uid: true });
      return { success: true };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailDeleteMessage(
  serviceConnectionId: string,
  mailbox: string,
  uid: number
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      await client.messageDelete(String(uid), { uid: true });
      return { success: true };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function emailMarkRead(
  serviceConnectionId: string,
  mailbox: string,
  uid: number,
  seen: boolean
) {
  const { imap } = await getEmailConfig(serviceConnectionId);
  const client = createImapClient(imap);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);

    try {
      if (seen) {
        await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
      }
      return { success: true, seen };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function validateEmailConnection(config: {
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  imapSecure?: boolean;
  smtpSecure?: boolean;
}): Promise<{ valid: boolean; error?: string }> {
  // Validate IMAP connection
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: config.imapSecure !== false,
    auth: {
      user: config.username,
      pass: config.password,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
  } catch (err) {
    return {
      valid: false,
      error: `IMAP connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  // Validate SMTP connection
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure !== false,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return {
      valid: false,
      error: `SMTP connection failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  return { valid: true };
}
