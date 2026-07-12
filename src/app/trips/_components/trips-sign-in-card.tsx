"use client";

import * as React from "react";
import { toast } from "sonner";

import { signIn } from "@/app/trips/_lib/trips-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/fetch-api";

export function TripsSignInCard({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("ChangeMe123!");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(username, password);
      toast.success("Signed in successfully");
      onSignedIn();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to sign in. Check your credentials.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in required</CardTitle>
        <CardDescription>
          Trip APIs need an authenticated session cookie. Sign in with your seeded admin account, or
          set <code className="text-xs">API_DEV_AUTH_BYPASS=true</code> in{" "}
          <code className="text-xs">.env.local</code> for local testing while auth is in progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="trip-sign-in-username">Username or email</Label>
            <Input
              id="trip-sign-in-username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="trip-sign-in-password">Password</Label>
            <Input
              id="trip-sign-in-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
