import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: never paint dashboard chrome without a valid session.
  const session = await requirePageSession("/dashboard");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        user={{ email: session.email, name: session.name, role: session.role }}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
