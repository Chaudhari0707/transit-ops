"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { MaintenanceLogForm } from "@/app/maintenance/_components/maintenance-log-form";
import { MaintenanceLogsTable } from "@/app/maintenance/_components/maintenance-logs-table";
import {
  closeMaintenanceLog,
  fetchMaintenanceLogs,
  fetchMaintenanceTypes,
  fetchOpenableVehicles,
  openMaintenanceLog,
} from "@/app/maintenance/_lib/maintenance-api";
import type {
  MaintenanceFormState,
  MaintenanceLogUi,
  MaintenancePageClientProps,
  MaintenanceTypeOption,
  MaintenanceVehicleOption,
} from "@/app/maintenance/_types/maintenance-ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isUnauthorizedErrorMessage,
  SESSION_EXPIRED_TOAST,
  toUserFacingApiError,
} from "@/lib/api/http-errors";

const emptyForm: MaintenanceFormState = {
  vehicleId: "",
  maintenanceTypeId: "",
  customServiceType: "",
  costInr: "",
  vendorName: "",
  description: "",
};

function handleClientApiError(message: string): void {
  if (isUnauthorizedErrorMessage(message)) {
    toast.error(SESSION_EXPIRED_TOAST);
    window.location.assign("/sign-in");
    return;
  }
  toast.error(toUserFacingApiError(message));
}

export function MaintenancePageClient({ canWrite }: MaintenancePageClientProps) {
  const [logs, setLogs] = useState<MaintenanceLogUi[]>([]);
  const [types, setTypes] = useState<MaintenanceTypeOption[]>([]);
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>([]);
  const [form, setForm] = useState<MaintenanceFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<number | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const [nextLogs, nextTypes, nextVehicles] = await Promise.all([
        fetchMaintenanceLogs(),
        fetchMaintenanceTypes(),
        fetchOpenableVehicles(),
      ]);
      setLogs(nextLogs);
      setTypes(nextTypes);
      setVehicles(nextVehicles);
      setForm((prev) => ({
        ...prev,
        vehicleId: nextVehicles.some((v) => v.id === prev.vehicleId)
          ? prev.vehicleId
          : (nextVehicles[0]?.id ?? ""),
        maintenanceTypeId: nextTypes.some((t) => t.id === prev.maintenanceTypeId)
          ? prev.maintenanceTypeId
          : (nextTypes[0]?.id ?? ""),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load maintenance data";
      handleClientApiError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleOpen() {
    setSubmitting(true);

    try {
      await openMaintenanceLog(form);
      toast.success("Maintenance opened — vehicle is In Shop");
      setForm((prev) => ({
        ...emptyForm,
        maintenanceTypeId: prev.maintenanceTypeId,
      }));
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open maintenance";
      handleClientApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(id: number) {
    setClosingId(id);

    try {
      await closeMaintenanceLog(id);
      toast.success("Maintenance closed — vehicle restored to Available");
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close maintenance";
      handleClientApiError(message);
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      {canWrite ? (
        <MaintenanceLogForm
          disabled={!canWrite}
          form={form}
          onChange={setForm}
          onSubmit={() => void handleOpen()}
          submitting={submitting}
          types={types}
          vehicles={vehicles}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>View only</CardTitle>
            <CardDescription>
              Your role can view maintenance costs but cannot open or close jobs.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <MaintenanceLogsTable
        canWrite={canWrite}
        closingId={closingId}
        loading={loading}
        logs={logs}
        onClose={(id) => void handleClose(id)}
      />
    </div>
  );
}
