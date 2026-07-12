"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FuelExpenseForms } from "@/app/fuel-expenses/_components/fuel-expense-forms";
import { FuelLogsTable } from "@/app/fuel-expenses/_components/fuel-logs-table";
import { OtherExpensesTable } from "@/app/fuel-expenses/_components/other-expenses-table";
import {
  createExpense,
  createFuelLog,
  fetchCategories,
  fetchFuelLogs,
  fetchOtherExpenses,
  fetchSummary,
  fetchVehicles,
} from "@/app/fuel-expenses/_lib/fuel-expenses-api";
import type {
  ExpenseCategoryOption,
  ExpenseFormState,
  FuelExpensesPageClientProps,
  FuelFormState,
  FuelLogUi,
  OperationalSummaryUi,
  OtherExpenseRowUi,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatInr(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const emptyFuel: FuelFormState = {
  vehicleId: "",
  liters: "",
  costInr: "",
  loggedAt: todayIsoDate(),
  notes: "",
};

const emptyExpense: ExpenseFormState = {
  vehicleId: "",
  expenseCategoryId: "",
  amountInr: "",
  incurredOn: todayIsoDate(),
  description: "",
};

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || lower.includes("request failed (401)");
}

export function FuelExpensesPageClient({ canWrite }: FuelExpensesPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<FuelLogUi[]>([]);
  const [otherRows, setOtherRows] = useState<OtherExpenseRowUi[]>([]);
  const [summary, setSummary] = useState<OperationalSummaryUi | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [fuelForm, setFuelForm] = useState<FuelFormState>(emptyFuel);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpense);
  const [submittingFuel, setSubmittingFuel] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const [nextLogs, nextOther, nextSummary, nextVehicles, nextCategories] = await Promise.all([
        fetchFuelLogs(),
        fetchOtherExpenses(),
        fetchSummary(),
        fetchVehicles(),
        fetchCategories(),
      ]);

      setLogs(nextLogs);
      setOtherRows(nextOther);
      setSummary(nextSummary);
      setVehicles(nextVehicles);
      setCategories(nextCategories);
      setFuelForm((prev) => ({
        ...prev,
        vehicleId: prev.vehicleId || nextVehicles[0]?.id || "",
        loggedAt: prev.loggedAt || todayIsoDate(),
      }));
      setExpenseForm((prev) => ({
        ...prev,
        vehicleId: prev.vehicleId || nextVehicles[0]?.id || "",
        expenseCategoryId: prev.expenseCategoryId || nextCategories[0]?.id || "",
        incurredOn: prev.incurredOn || todayIsoDate(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel & expenses";

      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleFuelSubmit() {
    setSubmittingFuel(true);

    try {
      await createFuelLog(fuelForm);
      toast.success("Fuel log saved");
      setFuelForm((prev) => ({
        ...emptyFuel,
        vehicleId: prev.vehicleId,
        loggedAt: todayIsoDate(),
      }));
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log fuel";
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setSubmittingFuel(false);
    }
  }

  async function handleExpenseSubmit() {
    setSubmittingExpense(true);

    try {
      await createExpense(expenseForm);
      toast.success("Expense saved");
      setExpenseForm((prev) => ({
        ...emptyExpense,
        vehicleId: prev.vehicleId,
        expenseCategoryId: prev.expenseCategoryId,
        incurredOn: todayIsoDate(),
      }));
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add expense";
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setSubmittingExpense(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      {summary ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Total operational cost (auto) = fuel + maintenance
            </CardTitle>
            <CardDescription>
              Toll/misc stay under other expenses and are not included in operational cost.
              Completed maintenance appears as MAINT. (LINKED) below.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <div className="text-muted-foreground">Fuel</div>
                <div className="font-semibold tabular-nums">{formatInr(summary.fuelTotalInr)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Maintenance</div>
                <div className="font-semibold tabular-nums">
                  {formatInr(summary.maintenanceTotalInr)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Toll / misc</div>
                <div className="font-semibold tabular-nums">
                  {formatInr(summary.expensesTotalInr)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Fuel efficiency</div>
                <div className="font-semibold tabular-nums">
                  {summary.fuelEfficiencyKmPerL ? `${summary.fuelEfficiencyKmPerL} km/L` : "—"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Op cost</div>
                <div className="text-lg font-bold text-amber-700 tabular-nums dark:text-amber-400">
                  {formatInr(summary.operationalCostInr)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading fuel & expenses…</p>
      ) : (
        <>
          <FuelExpenseForms
            canWrite={canWrite}
            categories={categories}
            expenseForm={expenseForm}
            fuelForm={fuelForm}
            onExpenseChange={setExpenseForm}
            onExpenseSubmit={() => void handleExpenseSubmit()}
            onFuelChange={setFuelForm}
            onFuelSubmit={() => void handleFuelSubmit()}
            submittingExpense={submittingExpense}
            submittingFuel={submittingFuel}
            vehicles={vehicles}
          />
          <FuelLogsTable logs={logs} />
          <OtherExpensesTable rows={otherRows} />
        </>
      )}
    </div>
  );
}
