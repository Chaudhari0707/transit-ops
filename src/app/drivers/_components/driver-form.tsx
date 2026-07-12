"use client";

import type { DriverFormState, LicenseCategoryOption } from "@/app/drivers/_types/drivers-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DriverFormProps = {
  categories: LicenseCategoryOption[];
  editingId: string | null;
  form: DriverFormState;
  isOnTrip: boolean;
  onCancelEdit: () => void;
  onChange: (next: DriverFormState) => void;
  onSubmit: () => void;
  submitting: boolean;
};

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function DriverForm({
  categories,
  editingId,
  form,
  isOnTrip,
  onCancelEdit,
  onChange,
  onSubmit,
  submitting,
}: DriverFormProps) {
  const canSubmit =
    !submitting &&
    form.fullName.trim().length > 0 &&
    form.licenseNumber.trim().length > 0 &&
    form.licenseCategoryId.length > 0 &&
    form.licenseExpiryDate.length === 10 &&
    form.contactNumber.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingId ? "Edit driver" : "Add driver"}</CardTitle>
        <CardDescription>
          Fleet Manager and Safety Officer full edit. Status <strong>on_trip</strong> is set by
          dispatch only (not selectable). Soft-delete blocked while on trip.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="drv-name">Full name</Label>
          <Input
            id="drv-name"
            value={form.fullName}
            onChange={(event) => onChange({ ...form, fullName: event.target.value })}
            maxLength={160}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-license">License number</Label>
          <Input
            id="drv-license"
            value={form.licenseNumber}
            onChange={(event) => onChange({ ...form, licenseNumber: event.target.value })}
            maxLength={64}
            className="font-mono"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-cat">License category</Label>
          <select
            id="drv-cat"
            className={selectClassName}
            value={form.licenseCategoryId}
            onChange={(event) => onChange({ ...form, licenseCategoryId: event.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.code})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-expiry">License expiry</Label>
          <Input
            id="drv-expiry"
            type="date"
            value={form.licenseExpiryDate}
            onChange={(event) => onChange({ ...form, licenseExpiryDate: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-contact">Contact number</Label>
          <Input
            id="drv-contact"
            value={form.contactNumber}
            onChange={(event) => onChange({ ...form, contactNumber: event.target.value })}
            maxLength={32}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-safety">Safety score (0–100)</Label>
          <Input
            id="drv-safety"
            type="number"
            min={0}
            max={100}
            step={1}
            value={form.safetyScore}
            onChange={(event) => onChange({ ...form, safetyScore: event.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="drv-status">Status</Label>
          {isOnTrip ? (
            <div className="flex h-8 items-center rounded-lg border border-input px-2.5 text-sm text-muted-foreground">
              On Trip (system — cannot change here except via Suspend below)
            </div>
          ) : null}
          <select
            id="drv-status"
            className={selectClassName}
            value={form.status}
            onChange={(event) =>
              onChange({
                ...form,
                status: event.target.value as DriverFormState["status"],
              })
            }
          >
            <option value="available">Available</option>
            <option value="off_duty">Off Duty</option>
            <option value="suspended">Suspended</option>
          </select>
          {isOnTrip ? (
            <p className="text-xs text-muted-foreground">
              Driver is on an active trip. Other fields can be updated; status stays On Trip unless
              you set Suspended.
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="drv-notes">Notes</Label>
          <Input
            id="drv-notes"
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
          />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button type="button" disabled={!canSubmit} onClick={onSubmit}>
            {submitting ? "Saving…" : editingId ? "Update driver" : "Create driver"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
