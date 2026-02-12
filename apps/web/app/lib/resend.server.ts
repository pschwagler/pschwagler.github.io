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

export async function sendContactEmail(
  email: string,
  message: string
): Promise<void> {
  const to = process.env.CONTACT_EMAIL;
  if (!to) {
    throw new Error("Missing CONTACT_EMAIL environment variable");
  }

  await getResend().emails.send({
    from: "Contact Form <onboarding@resend.dev>",
    to,
    replyTo: email,
    subject: `Portfolio contact from ${email}`,
    text: message,
  });
}

/** Reset the singleton (for testing only). */
export function _resetClient(): void {
  client = null;
}
