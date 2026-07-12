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
  signInFleetManager,
} from "@/app/maintenance/_lib/maintenance-api";
import type {
  MaintenanceFormState,
  MaintenanceLogUi,
  MaintenanceTypeOption,
  MaintenanceVehicleOption,
} from "@/app/maintenance/_types/maintenance-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm: MaintenanceFormState = {
  vehicleId: "",
  maintenanceTypeId: "",
  customServiceType: "",
  costInr: "",
  vendorName: "",
  description: "",
};

export function MaintenancePageClient() {
  const [logs, setLogs] = useState<MaintenanceLogUi[]>([]);
  const [types, setTypes] = useState<MaintenanceTypeOption[]>([]);
  const [vehicles, setVehicles] = useState<MaintenanceVehicleOption[]>([]);
  const [form, setForm] = useState<MaintenanceFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<number | null>(null);
  // Show sign-in immediately so the page never looks blank while session resolves.
  const [needsAuth, setNeedsAuth] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("ChangeMe123!");
  const [signingIn, setSigningIn] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const meResponse = await fetch("/api/auth/me", { credentials: "include" });

      if (meResponse.status === 401) {
        setNeedsAuth(true);
        setCanWrite(false);
        return;
      }

      if (!meResponse.ok) {
        throw new Error("Unable to resolve session");
      }

      const me = (await meResponse.json()) as { role: string };
      const writeAllowed = me.role === "fleet_manager";
      setCanWrite(writeAllowed);
      setNeedsAuth(false);

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

      if (message === "Unauthorized" || message.toLowerCase().includes("unauthorized")) {
        setNeedsAuth(true);
        setCanWrite(false);
      } else if (message === "Forbidden") {
        setNeedsAuth(false);
        setCanWrite(false);
        toast.error(
          "Your role cannot access maintenance. Fleet Manager or Financial Analyst only.",
        );
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleSignIn() {
    setSigningIn(true);

    try {
      await signInFleetManager(email, password);
      toast.success("Signed in");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

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
      toast.error(error instanceof Error ? error.message : "Failed to open maintenance");
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
      toast.error(error instanceof Error ? error.message : "Failed to close maintenance");
    } finally {
      setClosingId(null);
    }
  }

  if (needsAuth) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Maintenance API enforces RBAC. Sign in as fleet_manager (seed: admin@example.com /
              ChangeMe123!) to open and close jobs.
              {loading ? " Checking session…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maint-email">Email</Label>
              <Input
                id="maint-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maint-password">Password</Label>
              <Input
                id="maint-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={signingIn || loading}
              onClick={() => void handleSignIn()}
            >
              {signingIn ? "Signing in…" : loading ? "Checking…" : "Sign in"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading maintenance…</p>
      ) : (
        <>
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
            logs={logs}
            onClose={(id) => void handleClose(id)}
          />
        </>
      )}
    </div>
  );
}
