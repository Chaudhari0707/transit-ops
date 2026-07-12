import { describe, expect, test } from "bun:test";

import { assertDifferentLocations } from "@/modules/trips/_lib/trip-locations";

describe("assertDifferentLocations", () => {
  test("rejects identical source and destination", () => {
    expect(() =>
      assertDifferentLocations(
        "11111111-1111-1111-1111-111111111111",
        "11111111-1111-1111-1111-111111111111",
      ),
    ).toThrow("Source and destination must be different locations");
  });

  test("allows different locations", () => {
    expect(() =>
      assertDifferentLocations(
        "11111111-1111-1111-1111-111111111111",
        "22222222-2222-2222-2222-222222222222",
      ),
    ).not.toThrow();
  });
});
