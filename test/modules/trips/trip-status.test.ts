import { describe, expect, test } from "bun:test";

import {
  canCancelTrip,
  canCompleteTrip,
  canDispatchTrip,
  canEditTrip,
} from "@/modules/trips/_lib/trip-status";

describe("trip status guards", () => {
  test("only draft trips are editable", () => {
    expect(canEditTrip("draft")).toBe(true);
    expect(canEditTrip("dispatched")).toBe(false);
  });

  test("only draft trips can be dispatched", () => {
    expect(canDispatchTrip("draft")).toBe(true);
    expect(canDispatchTrip("completed")).toBe(false);
  });

  test("draft and dispatched trips can be cancelled", () => {
    expect(canCancelTrip("draft")).toBe(true);
    expect(canCancelTrip("dispatched")).toBe(true);
    expect(canCancelTrip("completed")).toBe(false);
  });

  test("only dispatched trips can be completed", () => {
    expect(canCompleteTrip("dispatched")).toBe(true);
    expect(canCompleteTrip("draft")).toBe(false);
  });
});
