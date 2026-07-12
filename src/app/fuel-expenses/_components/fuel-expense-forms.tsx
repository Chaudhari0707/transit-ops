"use client";

import type {
  ExpenseCategoryOption,
  ExpenseFormState,
  FuelFormState,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FuelExpenseFormsProps = {
  canWrite: boolean;
  categories: ExpenseCategoryOption[];
  expenseForm: ExpenseFormState;
  fuelForm: FuelFormState;
  onExpenseChange: (next: ExpenseFormState) => void;
  onExpenseSubmit: () => void;
  onFuelChange: (next: FuelFormState) => void;
  onFuelSubmit: () => void;
  submittingExpense: boolean;
  submittingFuel: boolean;
  vehicles: VehicleOption[];
};

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function FuelExpenseForms({
  canWrite,
  categories,
  expenseForm,
  fuelForm,
  onExpenseChange,
  onExpenseSubmit,
  onFuelChange,
  onFuelSubmit,
  submittingExpense,
  submittingFuel,
  vehicles,
}: FuelExpenseFormsProps) {
  if (!canWrite) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>+ Log fuel</CardTitle>
          <CardDescription>
            Manual fuel entry (Finance). Auto trip fuel comes from trip complete later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="fuel-vehicle">Vehicle</Label>
            <select
              id="fuel-vehicle"
              className={selectClassName}
              value={fuelForm.vehicleId}
              onChange={(event) => onFuelChange({ ...fuelForm, vehicleId: event.target.value })}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.nameModel} · {vehicle.registrationNumber}
                </option>
              ))}
            </select>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>+ Add expense</CardTitle>
          <CardDescription>
            Toll / fine / misc only. Maintenance is never added here — it links from completed
            service logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="exp-vehicle">Vehicle</Label>
            <select
              id="exp-vehicle"
              className={selectClassName}
              value={expenseForm.vehicleId}
              onChange={(event) =>
                onExpenseChange({ ...expenseForm, vehicleId: event.target.value })
              }
            >
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.nameModel} · {vehicle.registrationNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exp-cat">Category</Label>
            <select
              id="exp-cat"
              className={selectClassName}
              value={expenseForm.expenseCategoryId}
              onChange={(event) =>
                onExpenseChange({ ...expenseForm, expenseCategoryId: event.target.value })
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.code})
                </option>
              ))}
            </select>
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
        </CardContent>
      </Card>
    </div>
  );
}
