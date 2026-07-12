"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { getSignInErrorMessage, signInDefaultValues } from "@/app/sign-in/_lib/sign-in-helpers";
import { signInSchema } from "@/app/sign-in/_lib/sign-in-schema";
import type { SignInFormValues } from "@/app/sign-in/_types/sign-in";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/auth/_types/user-role";
import { authClient } from "@/lib/auth/auth-client";
import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";
import { cn } from "@/lib/utils";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  /** Client handlers are attached only after mount; avoid native post before hydration. */
  const [isClientReady, setIsClientReady] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    defaultValues: signInDefaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
    shouldFocusError: true,
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  async function onSubmit(values: SignInFormValues) {
    setFormError(null);

    const { error } = await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        rememberMe: true,
        callbackURL: "/dashboard",
      },
      {
        headers: {
          [LOGIN_ROLE_HEADER]: values.role,
        },
      },
    );

    if (error) {
      setFormError(getSignInErrorMessage(error));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      {...props}
      className={cn("flex flex-col gap-6", className)}
      data-ready={isClientReady ? "true" : "false"}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (!isClientReady) {
          return;
        }
        void handleSubmit(onSubmit)(event);
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in to TransitOps</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email, password, and assigned role to access the operations dashboard.
          </p>
        </div>

        <Field data-invalid={!!errors.email || undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.role || undefined}>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (value != null) {
                    field.onChange(value);
                  }
                }}
              >
                <SelectTrigger id="role" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Select your role">
                    {field.value ? USER_ROLE_LABELS[field.value] : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {USER_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.role]} />
        </Field>

        {formError ? (
          <Field>
            <FieldError>{formError}</FieldError>
          </Field>
        ) : null}

        <Field>
          <Button type="submit" disabled={!isClientReady || isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
