import type { CSSProperties } from "react";
import { headers } from "next/headers";

import { AnalyticsPageClient } from "@/app/analytics/_components/analytics-page-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isUserRole } from "@/lib/auth/_types/user-role";
import { auth } from "@/lib/auth/better-auth";

const shellStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties;

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user && "role" in session.user ? session.user.role : null;

  if (!session?.user || !isUserRole(role)) {
    return (
      <SidebarProvider style={shellStyle}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="Analytics" roleLabel="Fleet / Finance" />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="rounded-lg border p-6 text-sm text-muted-foreground">
                  Sign in required. Analytics is available to Fleet Manager and Financial Analyst.
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Analytics" roleLabel="Fleet / Finance" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            <AnalyticsPageClient />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
