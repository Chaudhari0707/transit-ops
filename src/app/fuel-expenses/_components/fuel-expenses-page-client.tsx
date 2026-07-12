"use client";

import { useCallback, useEffect, useState } from "react";
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
  fetchTripOptions,
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
  TripOption,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isUnauthorizedErrorMessage,
  SESSION_EXPIRED_TOAST,
  toUserFacingApiError,
} from "@/lib/api/http-errors";
import { ValueShimmerBar } from "@/lib/boneyard/table-row-shimmer";

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
  tripId: "",
  liters: "",
  costInr: "",
  loggedAt: todayIsoDate(),
  notes: "",
};

const emptyExpense: ExpenseFormState = {
  vehicleId: "",
  tripId: "",
  expenseCategoryId: "",
  amountInr: "",
  incurredOn: todayIsoDate(),
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

function OperationalSummaryCard({
  summary,
  loading = false,
}: {
  loading?: boolean;
  summary: OperationalSummaryUi | null;
}) {
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Total operational cost (auto) = fuel + maintenance
        </CardTitle>
        <CardDescription>
          Toll/misc stay under other expenses and are not included in operational cost. Completed
          maintenance appears as MAINT. (LINKED) above.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <div className="text-muted-foreground">Fuel</div>
            <div className="font-semibold tabular-nums">
              {loading || !summary ? (
                <ValueShimmerBar className="h-5 w-16" />
              ) : (
                formatInr(summary.fuelTotalInr)
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Maintenance</div>
            <div className="font-semibold tabular-nums">
              {loading || !summary ? (
                <ValueShimmerBar className="h-5 w-16" />
              ) : (
                formatInr(summary.maintenanceTotalInr)
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Toll / misc</div>
            <div className="font-semibold tabular-nums">
              {loading || !summary ? (
                <ValueShimmerBar className="h-5 w-16" />
              ) : (
                formatInr(summary.expensesTotalInr)
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Fuel efficiency</div>
            <div className="font-semibold tabular-nums">
              {loading || !summary ? (
                <ValueShimmerBar className="h-5 w-14" />
              ) : summary.fuelEfficiencyKmPerL ? (
                `${summary.fuelEfficiencyKmPerL} km/L`
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Op cost</div>
            <div className="text-lg font-bold text-amber-700 tabular-nums dark:text-amber-400">
              {loading || !summary ? (
                <ValueShimmerBar className="h-7 w-20" />
              ) : (
                formatInr(summary.operationalCostInr)
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FuelExpensesPageClient({ canWrite }: FuelExpensesPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<FuelLogUi[]>([]);
  const [otherRows, setOtherRows] = useState<OtherExpenseRowUi[]>([]);
  const [summary, setSummary] = useState<OperationalSummaryUi | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [fuelForm, setFuelForm] = useState<FuelFormState>(emptyFuel);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpense);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [submittingFuel, setSubmittingFuel] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const [nextLogs, nextOther, nextSummary, nextVehicles, nextCategories, nextTrips] =
        await Promise.all([
          fetchFuelLogs(),
          fetchOtherExpenses(),
          fetchSummary(),
          fetchVehicles(),
          fetchCategories(),
          fetchTripOptions(),
        ]);

      setLogs(nextLogs);
      setOtherRows(nextOther);
      setSummary(nextSummary);
      setVehicles(nextVehicles);
      setCategories(nextCategories);
      setTrips(nextTrips);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel & expenses";
      handleClientApiError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function openFuelModal() {
    setFuelForm({
      ...emptyFuel,
      loggedAt: todayIsoDate(),
    });
    setFuelOpen(true);
  }

  function openExpenseModal() {
    setExpenseForm({
      ...emptyExpense,
      expenseCategoryId: categories[0]?.id || "",
      incurredOn: todayIsoDate(),
    });
    setExpenseOpen(true);
  }

  async function handleFuelSubmit() {
    setSubmittingFuel(true);

    try {
      await createFuelLog(fuelForm);
      toast.success("Fuel log saved");
      setFuelOpen(false);
      setFuelForm(emptyFuel);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to log fuel";
      handleClientApiError(message);
    } finally {
      setSubmittingFuel(false);
    }
  }

  async function handleExpenseSubmit() {
    setSubmittingExpense(true);

    try {
      await createExpense(expenseForm);
      toast.success("Expense saved");
      setExpenseOpen(false);
      setExpenseForm(emptyExpense);
      await loadAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add expense";
      handleClientApiError(message);
    } finally {
      setSubmittingExpense(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      {/* Forms always available — never skeletonized */}
      <FuelExpenseForms
        canWrite={canWrite}
        categories={categories}
        expenseForm={expenseForm}
        expenseOpen={expenseOpen}
        fuelForm={fuelForm}
        fuelOpen={fuelOpen}
        onExpenseChange={setExpenseForm}
        onExpenseOpenChange={(open) => {
          if (open) {
            openExpenseModal();
          } else {
            setExpenseOpen(false);
          }
        }}
        onExpenseSubmit={() => void handleExpenseSubmit()}
        onFuelChange={setFuelForm}
        onFuelOpenChange={(open) => {
          if (open) {
            openFuelModal();
          } else {
            setFuelOpen(false);
          }
        }}
        onFuelSubmit={() => void handleFuelSubmit()}
        submittingExpense={submittingExpense}
        submittingFuel={submittingFuel}
        trips={trips}
        vehicles={vehicles}
      />

      <FuelLogsTable logs={logs} loading={loading} />
      <OtherExpensesTable rows={otherRows} loading={loading} />

      {/* Summary chrome always visible; only metric values shimmer */}
      <OperationalSummaryCard summary={summary} loading={loading} />
    </div>
  );
}
