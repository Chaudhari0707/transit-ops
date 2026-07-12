"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3Icon,
  CircleHelpIcon,
  FuelIcon,
  LayoutDashboardIcon,
  RouteIcon,
  SearchIcon,
  TruckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canCreateTrip, canSeeNavItem } from "@/lib/auth/_lib/sidebar-nav";
import type { SidebarNavId } from "@/lib/auth/_types/sidebar-nav";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/auth/_types/user-role";

const NAV_MAIN_CATALOG: Array<{
  id: SidebarNavId;
  title: string;
  url: string;
  icon: React.ReactNode;
}> = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    id: "trips",
    title: "Trips",
    url: "/trips",
    icon: <RouteIcon />,
  },
  {
    id: "fleet",
    title: "Fleet",
    url: "/dashboard/vehicles",
    icon: <TruckIcon />,
  },
  {
    id: "drivers",
    title: "Drivers",
    url: "/drivers",
    icon: <UsersIcon />,
  },
  {
    id: "analytics",
    title: "Analytics",
    url: "/analytics",
    icon: <BarChart3Icon />,
  },
];

const DOCUMENTS_CATALOG: Array<{
  id: SidebarNavId;
  name: string;
  url: string;
  icon: React.ReactNode;
}> = [
  {
    id: "maintenance",
    name: "Maintenance",
    url: "/maintenance",
    icon: <WrenchIcon />,
  },
  {
    id: "fuel_expenses",
    name: "Fuel & Expenses",
    url: "/fuel-expenses",
    icon: <FuelIcon />,
  },
  {
    id: "documents",
    name: "Documents",
    url: "/documents",
    icon: <TruckIcon />,
  },
];

const NAV_SECONDARY_CATALOG: Array<{
  id: SidebarNavId;
  title: string;
  url: string;
  icon: React.ReactNode;
}> = [
  {
    id: "help",
    title: "Help",
    url: "#",
    icon: <CircleHelpIcon />,
  },
  {
    id: "search",
    title: "Search",
    url: "#",
    icon: <SearchIcon />,
  },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    email: string;
    name: string;
    role: UserRole;
  };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const navMain = NAV_MAIN_CATALOG.filter((item) => canSeeNavItem(user.role, item.id)).map(
    ({ title, url, icon }) => ({ title, url, icon }),
  );
  const documents = DOCUMENTS_CATALOG.filter((item) => canSeeNavItem(user.role, item.id)).map(
    ({ name, url, icon }) => ({ name, url, icon }),
  );
  const navSecondary = NAV_SECONDARY_CATALOG.filter((item) =>
    canSeeNavItem(user.role, item.id),
  ).map(({ title, url, icon }) => ({ title, url, icon }));

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TruckIcon className="size-4" />
              </div>
              <span className="text-base font-semibold">TransitOps</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} showNewTrip={canCreateTrip(user.role)} />
        {documents.length > 0 ? <NavDocuments items={documents} label="Operations" /> : null}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            roleLabel: USER_ROLE_LABELS[user.role],
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
