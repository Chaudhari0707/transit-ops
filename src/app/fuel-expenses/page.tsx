import type { CSSProperties } from "react";

import { FuelExpensesPageClient } from "@/app/fuel-expenses/_components/fuel-expenses-page-client";
import { AccessDenied } from "@/components/access-denied";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { canAccessPageModule } from "@/lib/auth/_lib/sidebar-nav";
import { requirePageSession } from "@/lib/auth/require-page-session";

const shellStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties;

export default async function FuelExpensesPage() {
  const session = await requirePageSession("/fuel-expenses");
  const allowed = canAccessPageModule(session.role, "fuel_expenses");
  const canWrite = session.role === "fleet_manager" || session.role === "financial_analyst";

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        <SiteHeader title="Fuel & Expenses" roleLabel="Finance / Fleet" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            {allowed ? (
              <FuelExpensesPageClient canWrite={canWrite} />
            ) : (
              <AccessDenied description="Fuel & Expenses is available to Financial Analysts and Fleet Managers only." />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
