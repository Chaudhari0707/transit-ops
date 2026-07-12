import type { CSSProperties } from "react";

import { AnalyticsPageClient } from "@/app/analytics/_components/analytics-page-client";
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

export default async function AnalyticsPage() {
  const session = await requirePageSession("/analytics");
  const allowed = canAccessPageModule(session.role, "analytics");

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        <SiteHeader title="Analytics" roleLabel="Fleet / Finance" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            {allowed ? (
              <AnalyticsPageClient />
            ) : (
              <AccessDenied description="Analytics is available to Fleet Managers and Financial Analysts only." />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
