"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth";
import { EMPTY_LOGIN_STATE } from "@/lib/form-state";
import { Alert } from "@/components/ui/Alert";
import { TextField } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, EMPTY_LOGIN_STATE);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state.status === "error" && state.message ? <Alert tone="error">{state.message}</Alert> : null}

      <TextField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="username"
        inputMode="email"
        error={errors.email}
        placeholder="you@example.com"
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        error={errors.password}
      />

      <button type="submit" className="btn btn-primary w-full" disabled={isPending} aria-busy={isPending}>
        {isPending ? (
          <>
            <Spinner label="Signing in" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
