import { describe, expect, test } from "bun:test";

import {
  assertDocumentEntityType,
  assertDocumentReadRole,
  assertDocumentWriteRole,
  assertFileSizeWithinLimit,
  assertMimeAllowed,
  buildStorageRelativePath,
  DEFAULT_UPLOAD_MAX_BYTES,
  parseAllowedMimeList,
  parseUploadMaxBytes,
  sanitizeFileName,
} from "@/modules/documents/_lib/rules";

describe("assertDocument roles", () => {
  test("rejects non fleet manager for read", () => {
    expect(() => assertDocumentReadRole("dispatcher")).toThrow("Forbidden");
    expect(() => assertDocumentReadRole("financial_analyst")).toThrow("Forbidden");
    expect(() => assertDocumentReadRole("safety_officer")).toThrow("Forbidden");
  });

  test("allows fleet manager", () => {
    expect(() => assertDocumentReadRole("fleet_manager")).not.toThrow();
    expect(() => assertDocumentWriteRole("fleet_manager")).not.toThrow();
  });
});

describe("upload limits ADR-040", () => {
  test("defaults max bytes to 5MB", () => {
    expect(parseUploadMaxBytes(undefined)).toBe(DEFAULT_UPLOAD_MAX_BYTES);
  });

  test("rejects invalid max bytes", () => {
    expect(() => parseUploadMaxBytes("0")).toThrow("UPLOAD_MAX_BYTES");
    expect(() => parseUploadMaxBytes("abc")).toThrow("UPLOAD_MAX_BYTES");
  });

  test("star mime list allows all", () => {
    expect(parseAllowedMimeList("*")).toBeNull();
    expect(parseAllowedMimeList("")).toBeNull();
    expect(parseAllowedMimeList(undefined)).toBeNull();
  });

  test("enforces allow-list", () => {
    const allowed = parseAllowedMimeList("application/pdf,image/png");
    expect(allowed).not.toBeNull();
    expect(() => assertMimeAllowed("application/pdf", allowed)).not.toThrow();
    expect(() => assertMimeAllowed("image/jpeg", allowed)).toThrow("MIME type not allowed");
  });

  test("rejects oversize and empty files", () => {
    expect(() => assertFileSizeWithinLimit(0, 1000)).toThrow("empty");
    expect(() => assertFileSizeWithinLimit(2000, 1000)).toThrow("exceeds max size");
    expect(() => assertFileSizeWithinLimit(500, 1000)).not.toThrow();
  });
});

describe("entity and file name helpers", () => {
  test("entity type guard", () => {
    expect(assertDocumentEntityType("vehicle")).toBe("vehicle");
    expect(assertDocumentEntityType("maintenance_log")).toBe("maintenance_log");
    expect(() => assertDocumentEntityType("driver")).toThrow("entityType");
  });

  test("sanitize strips path traversal", () => {
    expect(sanitizeFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFileName("  RC book (1).pdf  ")).toBe("RC book (1).pdf");
    expect(() => sanitizeFileName("...")).toThrow("fileName is required");
  });

  test("storage path layout", () => {
    expect(buildStorageRelativePath("vehicle", "vid", "docid", "a.pdf")).toBe(
      "documents/vehicle/vid/docid-a.pdf",
    );
  });
});
