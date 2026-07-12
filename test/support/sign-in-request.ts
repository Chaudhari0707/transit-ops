import { LOGIN_ROLE_HEADER } from "@/lib/auth/login-role-header";

type SignInRequestInput = {
  email: string;
  forwardedFor?: string;
  password: string;
  role?: string;
  baseUrl?: string;
};

export async function postSignInEmail(input: SignInRequestInput) {
  const { auth } = await import("@/lib/auth/better-auth");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (input.role !== undefined) {
    headers.set(LOGIN_ROLE_HEADER, input.role);
  }

  if (input.forwardedFor) {
    headers.set("x-forwarded-for", input.forwardedFor);
  }

  const response = await auth.handler(
    new Request(
      `${input.baseUrl ?? Bun.env.BETTER_AUTH_URL ?? "http://127.0.0.1:3000"}/api/auth/sign-in/email`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      },
    ),
  );

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    status: response.status,
    body,
    setCookie: response.headers.get("set-cookie"),
  };
}
