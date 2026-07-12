"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DriverForm } from "@/app/drivers/_components/driver-form";
import { DriversTable } from "@/app/drivers/_components/drivers-table";
import {
  createDriver,
  deleteDriver,
  fetchDrivers,
  fetchLicenseCategories,
  signInUser,
  updateDriver,
} from "@/app/drivers/_lib/drivers-api";
import type {
  DriverFormState,
  DriverUi,
  LicenseCategoryOption,
} from "@/app/drivers/_types/drivers-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emptyForm: DriverFormState = {
  fullName: "",
  licenseNumber: "",
  licenseCategoryId: "",
  licenseExpiryDate: "",
  contactNumber: "",
  safetyScore: "100",
  status: "available",
  notes: "",
};

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DriversPageClient() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [drivers, setDrivers] = useState<DriverUi[]>([]);
  const [categories, setCategories] = useState<LicenseCategoryOption[]>([]);
  const [form, setForm] = useState<DriverFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOnTrip, setEditingOnTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("");
  const [search, setSearch] = useState("");
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
      const write = me.role === "fleet_manager" || me.role === "safety_officer";
      setCanWrite(write);
      setNeedsAuth(false);

      const [nextDrivers, nextCategories] = await Promise.all([
        fetchDrivers({
          status: statusFilter || undefined,
          licenseCompliance: complianceFilter || undefined,
          search: search.trim() || undefined,
        }),
        fetchLicenseCategories(),
      ]);
      setDrivers(nextDrivers);
      setCategories(nextCategories);
      setForm((prev) => ({
        ...prev,
        licenseCategoryId: prev.licenseCategoryId || nextCategories[0]?.id || "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load drivers";
      if (message.toLowerCase().includes("unauthorized") || message === "Forbidden") {
        setNeedsAuth(message.toLowerCase().includes("unauthorized"));
        if (message === "Forbidden") {
          toast.error("Drivers module requires Fleet Manager or Safety Officer.");
        }
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [complianceFilter, search, statusFilter]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleSignIn() {
    setSigningIn(true);
    try {
      await signInUser(email, password);
      toast.success("Signed in");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  function startEdit(driver: DriverUi) {
    setEditingId(driver.id);
    setEditingOnTrip(driver.status === "on_trip");
    setForm({
      fullName: driver.fullName,
      licenseNumber: driver.licenseNumber,
      licenseCategoryId: driver.licenseCategoryId,
      licenseExpiryDate: driver.licenseExpiryDate,
      contactNumber: driver.contactNumber,
      safetyScore: String(driver.safetyScore),
      status:
        driver.status === "on_trip" || driver.status === "available"
          ? "available"
          : driver.status === "off_duty"
            ? "off_duty"
            : "suspended",
      notes: driver.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingOnTrip(false);
    setForm((prev) => ({
      ...emptyForm,
      licenseCategoryId: prev.licenseCategoryId || categories[0]?.id || "",
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDriver(editingId, form);
        toast.success("Driver updated");
      } else {
        await createDriver(form);
        toast.success("Driver created");
      }
      cancelEdit();
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Soft-delete this driver?")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDriver(id);
      toast.success("Driver deleted");
      if (editingId === id) {
        cancelEdit();
      }
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  if (needsAuth) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Drivers CRUD requires Fleet Manager or Safety Officer.
              {loading ? " Checking session…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="drv-email">Email</Label>
              <Input
                id="drv-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drv-password">Password</Label>
              <Input
                id="drv-password"
                type="password"
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
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="filter-search">Search</Label>
          <Input
            id="filter-search"
            className="w-48"
            placeholder="Name, license, phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filter-status">Status</Label>
          <select
            id="filter-status"
            className={selectClassName}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="off_duty">Off Duty</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filter-lic">License</Label>
          <select
            id="filter-lic"
            className={selectClassName}
            value={complianceFilter}
            onChange={(event) => setComplianceFilter(event.target.value)}
          >
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading drivers…</p>
      ) : (
        <>
          {canWrite ? (
            <DriverForm
              categories={categories}
              editingId={editingId}
              form={form}
              isOnTrip={editingOnTrip}
              onCancelEdit={cancelEdit}
              onChange={setForm}
              onSubmit={() => void handleSubmit()}
              submitting={submitting}
            />
          ) : null}
          <DriversTable
            canWrite={canWrite}
            deletingId={deletingId}
            drivers={drivers}
            onDelete={(id) => void handleDelete(id)}
            onEdit={startEdit}
          />
        </>
      )}
    </div>
  );
}
