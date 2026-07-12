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

const data = {
  user: {
    name: "Rajesh Sharma",
    email: "rajesh@transitops.in",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Trips",
      url: "#",
      icon: <RouteIcon />,
    },
    {
      title: "Fleet",
      url: "/dashboard/vehicles",
      icon: <TruckIcon />,
    },
    {
      title: "Drivers",
      url: "#",
      icon: <UsersIcon />,
    },
    {
      title: "Analytics",
      url: "#",
      icon: <BarChart3Icon />,
    },
  ],
  navSecondary: [
    {
      title: "Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Maintenance",
      url: "#",
      icon: <WrenchIcon />,
    },
    {
      name: "Fuel & Expenses",
      url: "#",
      icon: <FuelIcon />,
    },
    {
      name: "Documents",
      url: "#",
      icon: <TruckIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} label="Operations" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
