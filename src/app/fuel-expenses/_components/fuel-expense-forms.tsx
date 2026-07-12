"use client";

import { useMemo } from "react";
import { FuelIcon, ReceiptIcon } from "lucide-react";

import type {
  ExpenseCategoryOption,
  ExpenseFormState,
  FuelFormState,
  TripOption,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_TRIP = "__none__";

/** Base UI Select falls back to raw value (UUID) when label is not resolved. */
function selectValue(id: string, resolvedLabel: string | null | undefined): string | null {
  if (!id || !resolvedLabel) {
    return null;
  }
  return id;
}

function vehicleLabel(vehicle: VehicleOption): string {
  return `${vehicle.nameModel} · ${vehicle.registrationNumber}`;
}

function categoryLabel(category: ExpenseCategoryOption): string {
  return `${category.name} (${category.code})`;
}

type FuelExpenseFormsProps = {
  canWrite: boolean;
  categories: ExpenseCategoryOption[];
  expenseForm: ExpenseFormState;
  expenseOpen: boolean;
  fuelForm: FuelFormState;
  fuelOpen: boolean;
  onExpenseChange: (next: ExpenseFormState) => void;
  onExpenseOpenChange: (open: boolean) => void;
  onExpenseSubmit: () => void;
  onFuelChange: (next: FuelFormState) => void;
  onFuelOpenChange: (open: boolean) => void;
  onFuelSubmit: () => void;
  submittingExpense: boolean;
  submittingFuel: boolean;
  trips: TripOption[];
  vehicles: VehicleOption[];
};

export function FuelExpenseForms({
  canWrite,
  categories,
  expenseForm,
  expenseOpen,
  fuelForm,
  fuelOpen,
  onExpenseChange,
  onExpenseOpenChange,
  onExpenseSubmit,
  onFuelChange,
  onFuelOpenChange,
  onFuelSubmit,
  submittingExpense,
  submittingFuel,
  trips,
  vehicles,
}: FuelExpenseFormsProps) {
  const vehicleItems = useMemo(
    () => vehicles.map((vehicle) => ({ label: vehicleLabel(vehicle), value: vehicle.id })),
    [vehicles],
  );
  const categoryItems = useMemo(
    () => categories.map((category) => ({ label: categoryLabel(category), value: category.id })),
    [categories],
  );
  const tripItems = useMemo(
    () => [
      { label: "No trip linked", value: NO_TRIP },
      ...trips.map((trip) => ({ label: trip.label, value: trip.id })),
    ],
    [trips],
  );

  const fuelVehicle = vehicles.find((vehicle) => vehicle.id === fuelForm.vehicleId);
  const fuelVehicleText = fuelVehicle ? vehicleLabel(fuelVehicle) : undefined;
  const fuelTrip = trips.find((trip) => trip.id === fuelForm.tripId);
  const fuelTripText = fuelForm.tripId ? fuelTrip?.label : "No trip linked";

  const expenseVehicle = vehicles.find((vehicle) => vehicle.id === expenseForm.vehicleId);
  const expenseVehicleText = expenseVehicle ? vehicleLabel(expenseVehicle) : undefined;
  const expenseCategory = categories.find(
    (category) => category.id === expenseForm.expenseCategoryId,
  );
  const expenseCategoryText = expenseCategory ? categoryLabel(expenseCategory) : undefined;
  const expenseTrip = trips.find((trip) => trip.id === expenseForm.tripId);
  const expenseTripText = expenseForm.tripId ? expenseTrip?.label : "No trip linked";

  function applyTripToFuel(tripIdOrNone: string) {
    if (tripIdOrNone === NO_TRIP) {
      onFuelChange({ ...fuelForm, tripId: "" });
      return;
    }
    const trip = trips.find((row) => row.id === tripIdOrNone);
    onFuelChange({
      ...fuelForm,
      tripId: tripIdOrNone,
      vehicleId: trip?.vehicleId ?? fuelForm.vehicleId,
      loggedAt: trip?.tripDate || fuelForm.loggedAt,
    });
  }

  function applyTripToExpense(tripIdOrNone: string) {
    if (tripIdOrNone === NO_TRIP) {
      onExpenseChange({ ...expenseForm, tripId: "" });
      return;
    }
    const trip = trips.find((row) => row.id === tripIdOrNone);
    onExpenseChange({
      ...expenseForm,
      tripId: tripIdOrNone,
      vehicleId: trip?.vehicleId ?? expenseForm.vehicleId,
      incurredOn: trip?.tripDate || expenseForm.incurredOn,
    });
  }

  if (!canWrite) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => onFuelOpenChange(true)}>
          <FuelIcon className="size-4" />
          Log fuel
        </Button>
        <Button type="button" variant="outline" onClick={() => onExpenseOpenChange(true)}>
          <ReceiptIcon className="size-4" />
          Add expense
        </Button>
      </div>

      <Dialog open={fuelOpen} onOpenChange={onFuelOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log fuel</DialogTitle>
            <DialogDescription>
              Manual fuel entry. Link a trip when the fill belongs to a dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fuel-trip">Trip (optional)</Label>
              <Select
                items={tripItems}
                value={fuelForm.tripId || NO_TRIP}
                onValueChange={(value) => {
                  if (value) applyTripToFuel(value);
                }}
              >
                <SelectTrigger
                  id="fuel-trip"
                  className="h-auto min-h-8 w-full items-start py-2 whitespace-normal *:data-[slot=select-value]:line-clamp-none"
                >
                  <SelectValue placeholder="Select trip">
                    {fuelTrip ? (
                      <span className="flex min-w-0 flex-col gap-0.5 text-left">
                        <span>
                          {fuelTrip.vehicleRegistration} · {fuelTrip.tripDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fuelTrip.destinationName} · {fuelTrip.driverName}
                        </span>
                      </span>
                    ) : (
                      fuelTripText
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="w-(--anchor-width) max-w-[min(100vw-2rem,42rem)] min-w-(--anchor-width)"
                >
                  <SelectItem value={NO_TRIP} label="No trip linked">
                    No trip linked
                  </SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id} label={trip.label}>
                      <span className="flex min-w-0 flex-col gap-0.5 whitespace-normal">
                        <span className="font-medium">
                          {trip.vehicleRegistration} · {trip.tripDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {trip.destinationName} · {trip.driverName}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fuel-vehicle">Vehicle</Label>
              <Select
                items={vehicleItems}
                value={selectValue(fuelForm.vehicleId, fuelVehicleText)}
                onValueChange={(value) => {
                  if (!value) return;
                  onFuelChange({
                    ...fuelForm,
                    vehicleId: value,
                    // Clear trip if it no longer matches the vehicle
                    tripId: fuelTrip && fuelTrip.vehicleId === value ? fuelForm.tripId : "",
                  });
                }}
              >
                <SelectTrigger id="fuel-vehicle" className="w-full">
                  <SelectValue placeholder="Select vehicle">{fuelVehicleText}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {vehicles.map((vehicle) => {
                    const label = vehicleLabel(vehicle);
                    return (
                      <SelectItem key={vehicle.id} value={vehicle.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fuel-liters">Liters</Label>
                <Input
                  id="fuel-liters"
                  type="number"
                  min={0.001}
                  step="0.001"
                  value={fuelForm.liters}
                  onChange={(event) => onFuelChange({ ...fuelForm, liters: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fuel-cost">Fuel cost (INR)</Label>
                <Input
                  id="fuel-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={fuelForm.costInr}
                  onChange={(event) => onFuelChange({ ...fuelForm, costInr: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fuel-date">Date</Label>
              <Input
                id="fuel-date"
                type="date"
                value={fuelForm.loggedAt}
                onChange={(event) => onFuelChange({ ...fuelForm, loggedAt: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fuel-notes">Notes</Label>
              <Input
                id="fuel-notes"
                value={fuelForm.notes}
                onChange={(event) => onFuelChange({ ...fuelForm, notes: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onFuelOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                submittingFuel ||
                !fuelForm.vehicleId ||
                !fuelForm.liters ||
                !fuelForm.costInr ||
                !fuelForm.loggedAt
              }
              onClick={onFuelSubmit}
            >
              {submittingFuel ? "Saving…" : "Log fuel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseOpen} onOpenChange={onExpenseOpenChange}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Toll / fine / misc only. Maintenance is never added here — it links from completed
              service logs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="exp-trip">Trip (optional)</Label>
              <Select
                items={tripItems}
                value={expenseForm.tripId || NO_TRIP}
                onValueChange={(value) => {
                  if (value) applyTripToExpense(value);
                }}
              >
                <SelectTrigger
                  id="exp-trip"
                  className="h-auto min-h-8 w-full items-start py-2 whitespace-normal *:data-[slot=select-value]:line-clamp-none"
                >
                  <SelectValue placeholder="Select trip">
                    {expenseTrip ? (
                      <span className="flex min-w-0 flex-col gap-0.5 text-left">
                        <span>
                          {expenseTrip.vehicleRegistration} · {expenseTrip.tripDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {expenseTrip.destinationName} · {expenseTrip.driverName}
                        </span>
                      </span>
                    ) : (
                      expenseTripText
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="w-(--anchor-width) max-w-[min(100vw-2rem,42rem)] min-w-(--anchor-width)"
                >
                  <SelectItem value={NO_TRIP} label="No trip linked">
                    No trip linked
                  </SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id} label={trip.label}>
                      <span className="flex min-w-0 flex-col gap-0.5 whitespace-normal">
                        <span className="font-medium">
                          {trip.vehicleRegistration} · {trip.tripDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {trip.destinationName} · {trip.driverName}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-vehicle">Vehicle</Label>
              <Select
                items={vehicleItems}
                value={selectValue(expenseForm.vehicleId, expenseVehicleText)}
                onValueChange={(value) => {
                  if (!value) return;
                  onExpenseChange({
                    ...expenseForm,
                    vehicleId: value,
                    tripId:
                      expenseTrip && expenseTrip.vehicleId === value ? expenseForm.tripId : "",
                  });
                }}
              >
                <SelectTrigger id="exp-vehicle" className="w-full">
                  <SelectValue placeholder="Select vehicle">{expenseVehicleText}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {vehicles.map((vehicle) => {
                    const label = vehicleLabel(vehicle);
                    return (
                      <SelectItem key={vehicle.id} value={vehicle.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-cat">Category</Label>
              <Select
                items={categoryItems}
                value={selectValue(expenseForm.expenseCategoryId, expenseCategoryText)}
                onValueChange={(value) => {
                  if (value) onExpenseChange({ ...expenseForm, expenseCategoryId: value });
                }}
              >
                <SelectTrigger id="exp-cat" className="w-full">
                  <SelectValue placeholder="Select category">{expenseCategoryText}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {categories.map((category) => {
                    const label = categoryLabel(category);
                    return (
                      <SelectItem key={category.id} value={category.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="exp-amount">Amount (INR)</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={expenseForm.amountInr}
                  onChange={(event) =>
                    onExpenseChange({ ...expenseForm, amountInr: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={expenseForm.incurredOn}
                  onChange={(event) =>
                    onExpenseChange({ ...expenseForm, incurredOn: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                value={expenseForm.description}
                onChange={(event) =>
                  onExpenseChange({ ...expenseForm, description: event.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onExpenseOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                submittingExpense ||
                !expenseForm.vehicleId ||
                !expenseForm.expenseCategoryId ||
                !expenseForm.amountInr ||
                !expenseForm.incurredOn
              }
              onClick={onExpenseSubmit}
            >
              {submittingExpense ? "Saving…" : "Add expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
