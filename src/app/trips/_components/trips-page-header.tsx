"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TripsPageHeader({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
        <h1 className="text-base font-medium">Trips</h1>

        <div className="relative ml-4 hidden max-w-sm flex-1 md:block">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search trips"
            className="h-8 pl-8"
            aria-label="Search trips"
          />
        </div>
      </div>
    </header>
  );
}
