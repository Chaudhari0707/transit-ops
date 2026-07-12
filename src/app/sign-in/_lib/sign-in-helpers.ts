import type { SignInFormValues } from "@/app/sign-in/_types/sign-in";

export const signInDefaultValues: SignInFormValues = {
  email: "",
  password: "",
  role: "fleet_manager",
};

export function getSignInErrorMessage(error: { message?: string; status?: number }): string {
  if (error.status === 429) {
    return "Account locked after 5 failed attempts. Try again later.";
  }

  return "Invalid username or password";
}
