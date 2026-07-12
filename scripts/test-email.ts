/**
 * Smoke-test Resend connectivity.
 * Usage: bun run email:test <recipient-email>
 */
export {};

const recipient = Bun.argv[2]?.trim();

if (!recipient || !recipient.includes("@")) {
  console.error("\nError: Recipient email address is required.");
  console.log("Usage: bun run email:test <recipient-email>\n");
  // @ts-expect-error - Bun.exit is not typed in NextJS global Bun types
  Bun.exit(1);
}

const apiKey = Bun.env.RESEND_API_KEY?.trim();
const fromAddress = Bun.env.EMAIL_FROM_ADDRESS?.trim() || "noreply@example.com";
const fromName = Bun.env.EMAIL_FROM_NAME?.trim() || "TransitOps";

if (!apiKey) {
  console.error("Error: RESEND_API_KEY is not set.");
  // @ts-expect-error - Bun.exit is not typed in NextJS global Bun types
  Bun.exit(1);
}

const from = `${fromName} <${fromAddress}>`;

console.log("\nPreparing Resend test email...");
console.log(`   From:    ${from}`);
console.log(`   To:      ${recipient}`);
console.log(`   Subject: TransitOps - Resend connection test`);

try {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "TransitOps - Resend connection test",
      text: "This email confirms Resend is configured for TransitOps.",
      html: `<p>This email confirms <strong>Resend</strong> is configured for TransitOps.</p>`,
    }),
  });

  const bodyText = await response.text();

  if (response.ok) {
    console.log("Success! Email sent.");
    console.log(`   Response: ${bodyText}\n`);
  } else {
    console.error(`Failed: Resend returned status ${response.status}`);
    console.error(`   Details: ${bodyText}\n`);
    // @ts-expect-error - Bun.exit is not typed in NextJS global Bun types
    Bun.exit(1);
  }
} catch (error: unknown) {
  console.error("Network or runtime error sending email:", error);
  // @ts-expect-error - Bun.exit is not typed in NextJS global Bun types
  Bun.exit(1);
}
