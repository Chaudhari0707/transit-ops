import { resolveSenderAddress, sendTransactionalEmail } from "@/lib/email/_lib/resend-client";
import {
  licenseExpirySubject,
  licenseExpiryTextBody,
} from "@/modules/notifications/plugins/license-expiry/_lib/templates";
import type {
  LicenseExpiryPayload,
  MailMode,
  SendEmailInput,
  SendEmailResult,
} from "@/modules/notifications/plugins/license-expiry/_types/notifications";

/**
 * Sends via log (dev) or shared Resend client (production).
 * No nodemailer/SMTP — Resend only when mode is `resend`.
 */
export async function sendViaMailMode(
  mode: MailMode,
  input: SendEmailInput,
  resendApiKey: string | null,
): Promise<SendEmailResult> {
  if (mode === "log") {
    console.log(
      `[notifications:mail:log] to=${input.to} from=${input.from} subject=${input.subject}\n${input.text}`,
    );
    return { providerMessageId: `log-${Date.now()}` };
  }

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required for resend mail mode");
  }

  return sendTransactionalEmail(
    {
      to: input.to,
      from: input.from,
      subject: input.subject,
      text: input.text,
      html: input.html,
    },
    { apiKey: resendApiKey },
  );
}

export function buildLicenseExpiryEmail(
  recipientEmail: string,
  fromEmail: string,
  payload: LicenseExpiryPayload,
): SendEmailInput {
  const text = licenseExpiryTextBody(payload);
  return {
    to: recipientEmail,
    from: fromEmail || resolveSenderAddress(),
    subject: licenseExpirySubject(payload),
    text,
  };
}
