"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DriverForm } from "@/app/drivers/_components/driver-form";
import { DriversTable } from "@/app/drivers/_components/drivers-table";
import {
  createDriver,
  deleteDriver,
  fetchDrivers,
  fetchLicenseCategories,
  updateDriver,
} from "@/app/drivers/_lib/drivers-api";
import type {
  DriverFormState,
  DriversPageClientProps,
  DriverUi,
  LicenseCategoryOption,
} from "@/app/drivers/_types/drivers-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || lower.includes("request failed (401)");
}

export function DriversPageClient({ canWrite }: DriversPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<DriverUi[]>([]);
  const [categories, setCategories] = useState<LicenseCategoryOption[]>([]);
  const [form, setForm] = useState<DriverFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOnTrip, setEditingOnTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const [nextDrivers, nextCategories] = await Promise.all([
        fetchDrivers({
          status: statusFilter === "all" ? undefined : statusFilter,
          licenseCompliance: complianceFilter === "all" ? undefined : complianceFilter,
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
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      if (message === "Forbidden") {
        toast.error("Drivers module requires Fleet Manager or Safety Officer.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [complianceFilter, router, search, statusFilter]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

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
      const message = error instanceof Error ? error.message : "Save failed";
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
      const message = error instanceof Error ? error.message : "Delete failed";
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
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
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value) setStatusFilter(value);
            }}
          >
            <SelectTrigger id="filter-status" className="w-44">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_trip">On Trip</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filter-lic">License</Label>
          <Select
            value={complianceFilter}
            onValueChange={(value) => {
              if (value) setComplianceFilter(value);
            }}
          >
            <SelectTrigger id="filter-lic" className="w-44">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expiring_soon">Expiring soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
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
