import type { CSSProperties } from "react";
import { Suspense } from "react";

import { TripsPageClient } from "@/app/trips/_components/trips-page-client";
import { loadExpenseCategories } from "@/app/trips/_lib/load-expense-categories";
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

export default async function TripsPage() {
  const session = await requirePageSession("/trips");
  const allowed = canAccessPageModule(session.role, "trips");
  const canWrite = session.role === "dispatcher";
  const expenseCategories = allowed ? await loadExpenseCategories() : [];

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        {allowed ? (
          <Suspense fallback={null}>
            <TripsPageClient canWrite={canWrite} expenseCategories={expenseCategories} />
          </Suspense>
        ) : (
          <>
            <SiteHeader title="Trips" roleLabel="Dispatcher / Safety" />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
                <AccessDenied description="Trip management is available to Dispatchers and Safety Officers only." />
              </div>
            </div>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
