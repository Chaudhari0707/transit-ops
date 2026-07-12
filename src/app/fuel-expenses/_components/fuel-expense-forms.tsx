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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
            <Select
              value={fuelForm.vehicleId || null}
              onValueChange={(value) => {
                if (value) onFuelChange({ ...fuelForm, vehicleId: value });
              }}
            >
              <SelectTrigger id="fuel-vehicle" className="w-full">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.nameModel} · {vehicle.registrationNumber}
                  </SelectItem>
                ))}
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
            <Select
              value={expenseForm.vehicleId || null}
              onValueChange={(value) => {
                if (value) onExpenseChange({ ...expenseForm, vehicleId: value });
              }}
            >
              <SelectTrigger id="exp-vehicle" className="w-full">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.nameModel} · {vehicle.registrationNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="exp-cat">Category</Label>
            <Select
              value={expenseForm.expenseCategoryId || null}
              onValueChange={(value) => {
                if (value) onExpenseChange({ ...expenseForm, expenseCategoryId: value });
              }}
            >
              <SelectTrigger id="exp-cat" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </SelectItem>
                ))}
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
