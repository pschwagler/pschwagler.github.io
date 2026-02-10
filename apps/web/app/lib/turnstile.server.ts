const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Validates a Cloudflare Turnstile token server-side.
 * Returns true if the token is valid, false otherwise.
 * If TURNSTILE_SECRET_KEY is not set, skips validation (dev mode).
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  ip: string
): Promise<{ success: boolean; errorCodes?: string[]; noToken?: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { success: true }; // Skip in dev

  if (!token) return { success: false, noToken: true };

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    }),
  });

  const data: TurnstileVerifyResponse = await response.json();
  return {
    success: data.success,
    errorCodes: data["error-codes"],
  };
}
