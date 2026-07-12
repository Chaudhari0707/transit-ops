import { describe, expect, test } from "bun:test";

import {
  daysUntilExpiry,
  isScheduledTimeNow,
  matchingReminderDay,
  parseEnabled,
  parseMailMode,
  parseReminderDays,
  parseScheduleTime,
  resolveRecipientEmail,
} from "@/modules/notifications/plugins/license-expiry/runtime";

describe("notification config failure modes", () => {
  test("parseReminderDays rejects empty tokens", () => {
    expect(() => parseReminderDays("a,b")).toThrow();
  });

  test("parseScheduleTime rejects invalid clock", () => {
    expect(() => parseScheduleTime("9am")).toThrow();
    expect(() => parseScheduleTime("24:00")).toThrow();
  });

  test("parseMailMode rejects unknown mode", () => {
    expect(() => parseMailMode("smtp")).toThrow();
  });
});

describe("notification config allow modes", () => {
  test("parseReminderDays sorts unique descending", () => {
    expect(parseReminderDays("7, 30, 14, 7")).toEqual([30, 14, 7]);
  });

  test("parseScheduleTime accepts HH:MM", () => {
    expect(parseScheduleTime("09:00")).toBe("09:00");
  });

  test("parseEnabled defaults true", () => {
    expect(parseEnabled(undefined)).toBe(true);
    expect(parseEnabled("false")).toBe(false);
  });

  test("parseMailMode accepts log and resend", () => {
    expect(parseMailMode("log")).toBe("log");
    expect(parseMailMode("RESEND")).toBe("resend");
  });
});

describe("license reminder matching failure modes", () => {
  test("does not match already expired licenses", () => {
    expect(matchingReminderDay("2026-01-01", [30, 14, 7], "2026-07-12")).toBeNull();
  });

  test("does not match off-threshold days", () => {
    expect(matchingReminderDay("2026-07-22", [30, 14, 7], "2026-07-12")).toBeNull();
  });

  test("resolveRecipientEmail returns null without usable addresses", () => {
    expect(resolveRecipientEmail("", "")).toBeNull();
    expect(resolveRecipientEmail("not-an-email", "also-bad")).toBeNull();
  });
});

describe("license reminder matching allow modes", () => {
  test("matches exact remaining-day thresholds", () => {
    expect(matchingReminderDay("2026-07-19", [30, 14, 7], "2026-07-12")).toBe(7);
    expect(matchingReminderDay("2026-07-26", [30, 14, 7], "2026-07-12")).toBe(14);
    expect(matchingReminderDay("2026-08-11", [30, 14, 7], "2026-07-12")).toBe(30);
  });

  test("daysUntilExpiry is UTC date based", () => {
    expect(daysUntilExpiry("2026-07-15", "2026-07-12")).toBe(3);
  });

  test("prefers linked user email over fallback", () => {
    expect(resolveRecipientEmail("Driver@Example.com", "admin@example.com")).toBe(
      "driver@example.com",
    );
  });

  test("falls back when linked email missing", () => {
    expect(resolveRecipientEmail(null, "admin@example.com")).toBe("admin@example.com");
  });

  test("isScheduledTimeNow matches UTC HH:MM", () => {
    const now = new Date("2026-07-12T09:00:30.000Z");
    expect(isScheduledTimeNow("09:00", now)).toBe(true);
    expect(isScheduledTimeNow("09:01", now)).toBe(false);
  });
});
