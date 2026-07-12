import { describe, expect, test } from "bun:test";

import {
  isValidLocationCode,
  isValidLocationName,
  normalizeLocationCode,
  normalizeLocationName,
} from "@/modules/locations/_lib/normalize-location";

describe("normalizeLocationCode", () => {
  test("uppercases and trims codes", () => {
    expect(normalizeLocationCode(" gnd_depot ")).toBe("GND_DEPOT");
  });
});

describe("normalizeLocationName", () => {
  test("trims and collapses whitespace", () => {
    expect(normalizeLocationName("  Ahmedabad   Hub ")).toBe("Ahmedabad Hub");
  });
});

describe("location validation failures", () => {
  test("rejects invalid code characters", () => {
    expect(isValidLocationCode("bad-code")).toBe(false);
  });

  test("rejects too-short names", () => {
    expect(isValidLocationName("A")).toBe(false);
  });

  test("accepts valid code and name", () => {
    expect(isValidLocationCode("AHM_HUB")).toBe(true);
    expect(isValidLocationName("Ahmedabad Hub")).toBe(true);
  });
});
