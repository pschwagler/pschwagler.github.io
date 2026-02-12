import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    client = new Resend(key);
  }
  return client;
}

export interface ContactEmailOptions {
  email: string;
  message: string;
  name?: string;
  company?: string;
  jobTitle?: string;
}

export async function sendContactEmail(
  options: ContactEmailOptions
): Promise<void> {
  const to = process.env.CONTACT_EMAIL;
  if (!to) {
    throw new Error("Missing CONTACT_EMAIL environment variable");
  }

  const { email, message, name, company, jobTitle } = options;

  const subject = name
    ? `Portfolio contact from ${name} (${email})`
    : `Portfolio contact from ${email}`;

  const lines: string[] = [];
  lines.push(`From: ${name ? `${name} <${email}>` : email}`);
  if (company) lines.push(`Company: ${company}`);
  if (jobTitle) lines.push(`Role: ${jobTitle}`);
  lines.push("", message);

  await getResend().emails.send({
    from: "Patrick Schwagler <onboarding@resend.dev>",
    to,
    replyTo: email,
    subject,
    text: lines.join("\n"),
  });
}

/** Reset the singleton (for testing only). */
export function _resetClient(): void {
  client = null;
}
