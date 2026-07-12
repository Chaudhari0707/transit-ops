import type { CSSProperties } from "react";

import { FuelExpensesPageClient } from "@/app/fuel-expenses/_components/fuel-expenses-page-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const shellStyle = {
  "--sidebar-width": "calc(var(--spacing) * 72)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties;

export default function FuelExpensesPage() {
  return (
    <SidebarProvider style={shellStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Fuel & Expenses" roleLabel="Finance / Fleet" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            <FuelExpensesPageClient />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
