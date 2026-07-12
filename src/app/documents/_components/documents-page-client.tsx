"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DocumentUploadForm } from "@/app/documents/_components/document-upload-form";
import { DocumentsTable } from "@/app/documents/_components/documents-table";
import {
  fetchDocumentMaintenanceLogs,
  fetchDocuments,
  fetchDocumentVehicles,
  softDeleteDocument,
  uploadDocument,
} from "@/app/documents/_lib/documents-api";
import type {
  DocumentEntityTypeUi,
  DocumentRowUi,
  DocumentsPageClientProps,
  MaintenanceLogOptionUi,
  VehicleOptionUi,
} from "@/app/documents/_types/documents-ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || lower.includes("request failed (401)");
}

function isForbiddenMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("forbidden") || lower.includes("request failed (403)");
}

export function DocumentsPageClient({ canWrite }: DocumentsPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [items, setItems] = useState<DocumentRowUi[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOptionUi[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogOptionUi[]>([]);
  const [filterType, setFilterType] = useState<DocumentEntityTypeUi | "all">("all");
  const [entityType, setEntityType] = useState<DocumentEntityTypeUi>("vehicle");
  const [entityId, setEntityId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setDenied(false);

    try {
      const [nextItems, nextVehicles, nextLogs] = await Promise.all([
        fetchDocuments({
          entityType: filterType === "all" ? "" : filterType,
        }),
        fetchDocumentVehicles(),
        fetchDocumentMaintenanceLogs(),
      ]);

      setItems(nextItems);
      setVehicles(nextVehicles);
      setMaintenanceLogs(nextLogs);

      setEntityId((prev) => {
        if (prev) {
          return prev;
        }

        if (entityType === "vehicle") {
          return nextVehicles[0]?.id ?? "";
        }

        return nextLogs[0]?.id ?? "";
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load documents";

      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }

      if (isForbiddenMessage(message)) {
        setDenied(true);
        setItems([]);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [entityType, filterType, router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (entityType === "vehicle") {
      setEntityId(vehicles[0]?.id ?? "");
      return;
    }

    setEntityId(maintenanceLogs[0]?.id ?? "");
  }, [entityType, maintenanceLogs, vehicles]);

  async function handleUpload() {
    if (!file || !entityId) {
      toast.error("Choose a target and a file");
      return;
    }

    setSubmitting(true);

    try {
      await uploadDocument({ entityType, entityId, file });
      toast.success("Document uploaded");
      setFile(null);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      await softDeleteDocument(id);
      toast.success("Document deleted");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  if (denied) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Documents are available to Fleet Manager only.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Documents</h2>
          <p className="text-sm text-muted-foreground">
            Vehicle and maintenance attachments (metadata in DB, files on local disk).
          </p>
        </div>
        <div className="w-48">
          <Select
            value={filterType}
            onValueChange={(value) => {
              if (value === "all" || value === "vehicle" || value === "maintenance_log") {
                setFilterType(value);
              }
            }}
          >
            <SelectTrigger aria-label="Filter by entity type">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="vehicle">Vehicles</SelectItem>
              <SelectItem value="maintenance_log">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DocumentUploadForm
        canWrite={canWrite}
        entityId={entityId}
        entityType={entityType}
        file={file}
        maintenanceLogs={maintenanceLogs}
        submitting={submitting}
        vehicles={vehicles}
        onEntityIdChange={setEntityId}
        onEntityTypeChange={setEntityType}
        onFileChange={setFile}
        onSubmit={() => void handleUpload()}
      />

      <DocumentsTable
        canWrite={canWrite}
        deletingId={deletingId}
        items={items}
        loading={loading}
        onDelete={(id) => void handleDelete(id)}
      />
    </div>
  );
}
