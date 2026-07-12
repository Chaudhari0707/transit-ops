"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/auth-client";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];

  if (!first) {
    return "?";
  }
  if (!second) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string;
    roleLabel?: string;
  };
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initials = getInitials(user.name);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      // Prefer explicit endpoint so Set-Cookie expiry from Better Auth is applied.
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        await authClient.signOut({
          fetchOptions: { credentials: "include" },
        });
      }
    } catch {
      try {
        await authClient.signOut({
          fetchOptions: { credentials: "include" },
        });
      } catch {
        // Hard navigate regardless — Proxy will bounce invalid sessions.
      }
    }

    window.location.assign("/sign-in");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          data-testid="nav-user-menu"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
        >
          <Avatar className="size-8 rounded-lg grayscale">
            {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-foreground/70">{user.email}</span>
            {user.roleLabel ? (
              <span className="truncate text-xs text-muted-foreground">{user.roleLabel}</span>
            ) : null}
          </div>
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          data-testid="nav-user-logout"
          tooltip={isSigningOut ? "Signing out…" : "Log out"}
          disabled={isSigningOut}
          onClick={() => {
            void handleSignOut();
          }}
        >
          <LogOutIcon />
          <span>{isSigningOut ? "Signing out…" : "Log out"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
