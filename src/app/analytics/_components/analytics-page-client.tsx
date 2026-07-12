"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { AnalyticsKpiCards } from "@/app/analytics/_components/analytics-kpi-cards";
import { CostliestVehicles } from "@/app/analytics/_components/costliest-vehicles";
import { MonthlyRevenueChart } from "@/app/analytics/_components/monthly-revenue-chart";
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
    <div className="flex flex-col gap-4 px-4 lg:gap-6 lg:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Reports &amp; Analytics</h2>
          <p className="text-sm text-muted-foreground">{report.summary.roiFormula}</p>
        </div>
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

      <AnalyticsKpiCards summary={report.summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyRevenueChart points={report.monthlyRevenue} />
        <CostliestVehicles items={report.costliestVehicles} />
      </div>
    </div>
  );
}
