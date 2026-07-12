import type { DocumentRowUi } from "@/app/documents/_types/documents-ui";

export const FIXTURE_DOCUMENTS = [
  {
    id: "fixture-doc-1",
    fileName: "vehicle-rc-UBE123A.pdf",
    mimeType: "application/pdf",
    sizeBytes: 245_760,
    entityType: "vehicle",
    entityId: "fixture-vehicle-1",
    entityLabel: "UBE 123A · Coaster",
    createdAt: "2026-03-01T10:15:00.000Z",
  },
  {
    id: "fixture-doc-2",
    fileName: "insurance-UBE456B.pdf",
    mimeType: "application/pdf",
    sizeBytes: 512_000,
    entityType: "vehicle",
    entityId: "fixture-vehicle-2",
    entityLabel: "UBE 456B · Hiace",
    createdAt: "2026-03-05T14:30:00.000Z",
  },
  {
    id: "fixture-doc-3",
    fileName: "service-invoice-2026-02.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1_048_576,
    entityType: "maintenance_log",
    entityId: "fixture-log-1",
    entityLabel: "Service · UBE 123A",
    createdAt: "2026-02-20T09:00:00.000Z",
  },
  {
    id: "fixture-doc-4",
    fileName: "parts-receipt.png",
    mimeType: "image/png",
    sizeBytes: 320_000,
    entityType: "maintenance_log",
    entityId: "fixture-log-2",
    entityLabel: "Parts · UBE 456B",
    createdAt: "2026-02-28T16:45:00.000Z",
  },
] as const satisfies readonly DocumentRowUi[];
