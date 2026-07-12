import "server-only";

/**
 * Server-only Resend surface for Next.js / app server code.
 * Implementation: `_lib/resend-client.ts` (pure, unit-tested).
 */
export {
  getResendApiKey,
  resolveSenderAddress,
  sendTransactionalEmail,
} from "@/lib/email/_lib/resend-client";
