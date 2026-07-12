"use client";

import Image from "next/image";
import Link from "next/link";
import { TruckIcon } from "lucide-react";

import { LoginForm } from "@/app/sign-in/_components/login-form";

export function SignInPageClient() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <TruckIcon className="size-4" />
            </div>
            TransitOps
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-muted lg:block">
        <Image
          src="/images/sign-in-panel.jpg"
          alt="TransitOps fleet operations control center"
          fill
          className="object-cover"
          sizes="50vw"
          loading="eager"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="max-w-md text-lg font-semibold tracking-tight">
            Smart Transport Operations Platform
          </p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Fleet registry, driver compliance, trip dispatch, and operational KPIs in one workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
