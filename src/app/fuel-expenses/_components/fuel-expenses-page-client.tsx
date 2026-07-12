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
  fetchVehicles,
  signInUser,
} from "@/app/fuel-expenses/_lib/fuel-expenses-api";
import type {
  ExpenseCategoryOption,
  ExpenseFormState,
  FuelFormState,
  FuelLogUi,
  OperationalSummaryUi,
  OtherExpenseRowUi,
  VehicleOption,
} from "@/app/fuel-expenses/_types/fuel-expenses-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function FuelExpensesPageClient() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [logs, setLogs] = useState<FuelLogUi[]>([]);
  const [otherRows, setOtherRows] = useState<OtherExpenseRowUi[]>([]);
  const [summary, setSummary] = useState<OperationalSummaryUi | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [fuelForm, setFuelForm] = useState<FuelFormState>(emptyFuel);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(emptyExpense);
  const [submittingFuel, setSubmittingFuel] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
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
      setCanWrite(me.role === "financial_analyst" || me.role === "fleet_manager");
      setNeedsAuth(false);

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

      if (message.toLowerCase().includes("unauthorized")) {
        setNeedsAuth(true);
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
      await signInUser(email, password);
      toast.success("Signed in");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

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
      toast.error(error instanceof Error ? error.message : "Failed to log fuel");
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
      toast.error(error instanceof Error ? error.message : "Failed to add expense");
    } finally {
      setSubmittingExpense(false);
    }
  }

  if (needsAuth) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Use fleet manager or finance seed accounts to open Fuel & Expenses.
              {loading ? " Checking session…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fe-email">Email</Label>
              <Input
                id="fe-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fe-password">Password</Label>
              <Input
                id="fe-password"
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
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
