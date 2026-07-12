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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body.slice(0, 400)}`);
  }

  const json = (await response.json()) as { id?: string };
  return { providerMessageId: json.id ?? null };
}

export function buildLicenseExpiryEmail(
  recipientEmail: string,
  fromEmail: string,
  payload: LicenseExpiryPayload,
): SendEmailInput {
  return {
    to: recipientEmail,
    from: fromEmail,
    subject: licenseExpirySubject(payload),
    text: licenseExpiryTextBody(payload),
  };
}
