"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { AnalyticsKpiCards } from "@/app/analytics/_components/analytics-kpi-cards";
import { CostBreakdownChart } from "@/app/analytics/_components/cost-breakdown-chart";
import { CostliestVehicles } from "@/app/analytics/_components/costliest-vehicles";
import { FleetStatusPanel } from "@/app/analytics/_components/fleet-status-panel";
import { MonthlyRevenueChart } from "@/app/analytics/_components/monthly-revenue-chart";
import { VehicleRoiTable } from "@/app/analytics/_components/vehicle-roi-table";
import {
  downloadCsvFile,
  exportAnalyticsCsv,
  fetchAnalyticsReport,
} from "@/app/analytics/_lib/analytics-api";
import type { AnalyticsReportUi } from "@/app/analytics/_types/analytics-ui";
import { Button } from "@/components/ui/button";

function isUnauthorizedMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("unauthorized") || lower.includes("request failed (401)");
}

function isForbiddenMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("forbidden") || lower.includes("request failed (403)");
}

export function AnalyticsPageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState<AnalyticsReportUi | null>(null);
  const [denied, setDenied] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setDenied(false);

    try {
      const next = await fetchAnalyticsReport();
      setReport(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load analytics";

      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }

      if (isForbiddenMessage(message)) {
        setDenied(true);
        setReport(null);
        return;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  async function handleExport() {
    setExporting(true);

    try {
      const { csv, filename } = await exportAnalyticsCsv();
      downloadCsvFile(csv, filename);
      toast.success("CSV exported");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      if (isUnauthorizedMessage(message)) {
        router.replace("/sign-in");
        return;
      }
      toast.error(message);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Loading reports & analytics…</p>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Analytics is available to Fleet Manager and Financial Analyst roles only.
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="px-4 lg:px-6">
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          Unable to load analytics. Try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Reports &amp; Analytics</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {report.summary.roiFormula}. Deep view includes cost composition, fleet pulse, and
            per-vehicle ROI from live seed data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadReport()}>
            <RefreshCwIcon className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            <DownloadIcon className="size-4" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Overview KPIs
        </h3>
        <AnalyticsKpiCards summary={report.summary} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Charts
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <MonthlyRevenueChart points={report.monthlyRevenue} />
          <CostBreakdownChart breakdown={report.costBreakdown} />
          <CostliestVehicles items={report.costliestVehicles} />
          <FleetStatusPanel summary={report.summary} tripCounts={report.tripCounts} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Deep analytics
        </h3>
        <VehicleRoiTable rows={report.vehicleRoiTable} />
      </section>
    </div>
  );
}
