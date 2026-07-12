import type { CSSProperties } from "react";

import { MaintenancePageClient } from "@/app/maintenance/_components/maintenance-page-client";
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

export default async function MaintenancePage() {
  const session = await requirePageSession("/maintenance");
  const allowed = canAccessPageModule(session.role, "maintenance");
  const canWrite = session.role === "fleet_manager";

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        <SiteHeader title="Maintenance" roleLabel="Fleet Manager" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            {allowed ? (
              <MaintenancePageClient canWrite={canWrite} />
            ) : (
              <AccessDenied description="Maintenance is available to Fleet Managers and Financial Analysts only." />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
