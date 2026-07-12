import type { CSSProperties } from "react";

import { DriversPageClient } from "@/app/drivers/_components/drivers-page-client";
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

export default async function DriversPage() {
  const session = await requirePageSession("/drivers");
  const allowed = canAccessPageModule(session.role, "drivers");
  const canWrite = session.role === "fleet_manager" || session.role === "safety_officer";

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        <SiteHeader title="Drivers" roleLabel="Fleet / Safety" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            {allowed ? (
              <DriversPageClient canWrite={canWrite} />
            ) : (
              <AccessDenied description="Drivers administration is available to Fleet Managers and Safety Officers only." />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
