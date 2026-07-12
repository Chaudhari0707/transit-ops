"use client";

import * as React from "react";

import { todayIsoDate } from "@/app/trips/_lib/trip-form-helpers";
import { completeTripSchema } from "@/app/trips/_lib/trip-form-schema";
import { completeTrip } from "@/app/trips/_lib/trips-api";
import type { CompleteTripFormValues, ExpenseCategoryOption } from "@/app/trips/_types/trip-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api/fetch-api";
import type { TripRecord } from "@/modules/trips/_types/trip";

type FieldErrors = Partial<Record<keyof CompleteTripFormValues, string>>;

const emptyCompleteForm = (): CompleteTripFormValues => ({
  endOdometerKm: "",
  fuelLiters: "",
  fuelCostInr: "",
  expenseCategoryId: "",
  expenseAmountInr: "",
  expenseDescription: "",
});

export function TripCompleteSheet({
  trip,
  expenseCategories,
  open,
  onOpenChange,
  onCompleted,
  onError,
}: {
  trip: TripRecord | null;
  expenseCategories: ExpenseCategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
  onError: (message: string) => void;
}) {
  const [values, setValues] = React.useState<CompleteTripFormValues>(emptyCompleteForm);
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open && trip) {
      setValues({
        ...emptyCompleteForm(),
        endOdometerKm: trip.startOdometerKm ?? "",
        expenseCategoryId: expenseCategories[0]?.id ?? "",
      });
      setFieldErrors({});
    }
  }, [open, trip, expenseCategories]);

  function updateField<K extends keyof CompleteTripFormValues>(
    key: K,
    value: CompleteTripFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trip) {
      return;
    }

    const parsed = completeTripSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key as keyof CompleteTripFormValues]) {
          nextErrors[key as keyof CompleteTripFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await completeTrip(trip.id, {
        endOdometerKm: parsed.data.endOdometerKm,
        fuelLiters: parsed.data.fuelLiters,
        fuelCostInr: parsed.data.fuelCostInr,
        expenses: [
          {
            expenseCategoryId: parsed.data.expenseCategoryId,
            amountInr: parsed.data.expenseAmountInr,
            incurredOn: todayIsoDate(),
            description: parsed.data.expenseDescription,
          },
        ],
      });
      onOpenChange(false);
      onCompleted();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to complete trip";
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Complete trip</SheetTitle>
          <SheetDescription>
            Final odometer, fuel log, and at least one trip expense are required before freeing the
            vehicle and driver.
          </SheetDescription>
        </SheetHeader>

        {trip ? (
          <form className="grid gap-4 px-4" onSubmit={handleSubmit}>
            <p className="text-sm text-muted-foreground">
              Start odometer: {trip.startOdometerKm ?? "—"} km
            </p>

            <div className="grid gap-2" data-invalid={fieldErrors.endOdometerKm ? true : undefined}>
              <Label htmlFor="complete-odometer">Final odometer (km)</Label>
              <Input
                id="complete-odometer"
                type="number"
                min="0"
                step="0.1"
                value={values.endOdometerKm}
                onChange={(event) => updateField("endOdometerKm", event.target.value)}
                aria-invalid={!!fieldErrors.endOdometerKm}
              />
              {fieldErrors.endOdometerKm ? (
                <p className="text-sm text-destructive">{fieldErrors.endOdometerKm}</p>
              ) : null}
            </div>

            <div className="grid gap-2" data-invalid={fieldErrors.fuelLiters ? true : undefined}>
              <Label htmlFor="complete-fuel-liters">Fuel (liters)</Label>
              <Input
                id="complete-fuel-liters"
                type="number"
                min="0.001"
                step="0.001"
                value={values.fuelLiters}
                onChange={(event) => updateField("fuelLiters", event.target.value)}
                aria-invalid={!!fieldErrors.fuelLiters}
              />
              {fieldErrors.fuelLiters ? (
                <p className="text-sm text-destructive">{fieldErrors.fuelLiters}</p>
              ) : null}
            </div>

            <div className="grid gap-2" data-invalid={fieldErrors.fuelCostInr ? true : undefined}>
              <Label htmlFor="complete-fuel-cost">Fuel cost (INR)</Label>
              <Input
                id="complete-fuel-cost"
                type="number"
                min="0"
                step="0.01"
                value={values.fuelCostInr}
                onChange={(event) => updateField("fuelCostInr", event.target.value)}
                aria-invalid={!!fieldErrors.fuelCostInr}
              />
              {fieldErrors.fuelCostInr ? (
                <p className="text-sm text-destructive">{fieldErrors.fuelCostInr}</p>
              ) : null}
            </div>

            <div
              className="grid gap-2"
              data-invalid={fieldErrors.expenseCategoryId ? true : undefined}
            >
              <Label htmlFor="complete-expense-category">Expense category</Label>
              <Select
                value={values.expenseCategoryId || null}
                onValueChange={(value) => updateField("expenseCategoryId", value ?? "")}
              >
                <SelectTrigger
                  id="complete-expense-category"
                  aria-invalid={!!fieldErrors.expenseCategoryId}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.expenseCategoryId ? (
                <p className="text-sm text-destructive">{fieldErrors.expenseCategoryId}</p>
              ) : null}
            </div>

            <div
              className="grid gap-2"
              data-invalid={fieldErrors.expenseAmountInr ? true : undefined}
            >
              <Label htmlFor="complete-expense-amount">Expense amount (INR)</Label>
              <Input
                id="complete-expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={values.expenseAmountInr}
                onChange={(event) => updateField("expenseAmountInr", event.target.value)}
                aria-invalid={!!fieldErrors.expenseAmountInr}
              />
              {fieldErrors.expenseAmountInr ? (
                <p className="text-sm text-destructive">{fieldErrors.expenseAmountInr}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="complete-expense-description">Expense note (optional)</Label>
              <Input
                id="complete-expense-description"
                value={values.expenseDescription}
                onChange={(event) => updateField("expenseDescription", event.target.value)}
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Completing…" : "Complete trip"}
              </Button>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
