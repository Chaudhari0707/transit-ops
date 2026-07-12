import type {
  SendTransactionalEmailInput,
  SendTransactionalEmailRecipient,
  SendTransactionalEmailResult,
  SendViaResendOptions,
} from "@/lib/email/_types/resend";

const RESEND_SEND_EMAIL_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_NAME = "TransitOps";
const DEFAULT_FROM_ADDRESS = "noreply@example.com";

/**
 * Pure Resend helpers (no `server-only`) so unit tests and scripts can import them.
 * App entry: `@/lib/email/resend` (server boundary).
 */
export function getResendApiKey(
  env: Record<string, string | undefined> = Bun.env as Record<string, string | undefined>,
): string {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send transactional email.");
  }
  return apiKey;
}

/** Builds `Name <address>` from EMAIL_FROM_* (or notification override if provided). */
export function resolveSenderAddress(
  env: Record<string, string | undefined> = Bun.env as Record<string, string | undefined>,
  override?: string | null,
): string {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) {
    return trimmedOverride;
  }

  const email = env.EMAIL_FROM_ADDRESS?.trim() || DEFAULT_FROM_ADDRESS;
  const name = env.EMAIL_FROM_NAME?.trim() || DEFAULT_FROM_NAME;
  return `${name} <${email}>`;
}

function formatRecipient(to: SendTransactionalEmailRecipient | string): string {
  if (typeof to === "string") {
    return to;
  }
  return to.name ? `${to.name} <${to.email}>` : to.email;
}

/**
 * Sends a transactional email via Resend's HTTP API.
 * Dependency-free fetch — same approach as crazy-collection-ecom (no SDK/nodemailer).
 */
export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
  options: SendViaResendOptions = {},
): Promise<SendTransactionalEmailResult> {
  const env = options.env ?? (Bun.env as Record<string, string | undefined>);
  const apiKey = options.apiKey ?? getResendApiKey(env);
  const from = input.from?.trim() || resolveSenderAddress(env);

  if (!input.text && !input.html) {
    throw new Error("sendTransactionalEmail requires text and/or html body");
  }

  const response = await fetch(RESEND_SEND_EMAIL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [formatRecipient(input.to)],
      subject: input.subject,
      ...(input.text ? { text: input.text } : {}),
      ...(input.html ? { html: input.html } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as { id?: string };
  return { providerMessageId: json.id ?? null };
}
