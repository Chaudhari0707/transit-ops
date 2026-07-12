import { afterEach, describe, expect, mock, test } from "bun:test";

import {
  getResendApiKey,
  resolveSenderAddress,
  sendTransactionalEmail,
} from "@/lib/email/_lib/resend-client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("resend client failure modes", () => {
  test("getResendApiKey throws when missing", () => {
    expect(() => getResendApiKey({})).toThrow("RESEND_API_KEY is required");
  });

  test("sendTransactionalEmail requires body content", async () => {
    await expect(
      sendTransactionalEmail({ to: "a@example.com", subject: "x" }, { apiKey: "re_test", env: {} }),
    ).rejects.toThrow("text and/or html");
  });

  test("sendTransactionalEmail surfaces Resend HTTP errors", async () => {
    globalThis.fetch = mock(
      async () => new Response("bad key", { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(
      sendTransactionalEmail(
        { to: "a@example.com", subject: "Hi", text: "body" },
        { apiKey: "re_bad", env: {} },
      ),
    ).rejects.toThrow("Resend API 401");
  });
});

describe("resend client allow modes", () => {
  test("resolveSenderAddress prefers override then EMAIL_FROM_*", () => {
    expect(resolveSenderAddress({}, "Ops <ops@example.com>")).toBe("Ops <ops@example.com>");
    expect(
      resolveSenderAddress({
        EMAIL_FROM_ADDRESS: "noreply@fleet.test",
        EMAIL_FROM_NAME: "Fleet",
      }),
    ).toBe("Fleet <noreply@fleet.test>");
  });

  test("getResendApiKey trims value", () => {
    expect(getResendApiKey({ RESEND_API_KEY: "  re_abc  " })).toBe("re_abc");
  });

  test("sendTransactionalEmail posts to Resend and returns message id", async () => {
    const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://api.resend.com/emails");
      expect(init?.method).toBe("POST");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer re_ok");
      const body = JSON.parse(String(init?.body)) as {
        from: string;
        to: string[];
        subject: string;
        text: string;
      };
      expect(body.to).toEqual(["driver@example.com"]);
      expect(body.subject).toBe("License reminder");
      expect(body.text).toContain("expires");
      return new Response(JSON.stringify({ id: "msg_123" }), { status: 200 });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendTransactionalEmail(
      {
        to: "driver@example.com",
        from: "TransitOps <noreply@example.com>",
        subject: "License reminder",
        text: "License expires soon",
      },
      { apiKey: "re_ok", env: {} },
    );

    expect(result.providerMessageId).toBe("msg_123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
