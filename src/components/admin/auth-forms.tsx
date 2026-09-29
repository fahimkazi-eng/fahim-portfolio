"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { loginAction, logoutAction } from "@/app/actions/admin";
import { idleState, type ActionState } from "@/lib/validations/schemas";
import { Field, FormStatus, Input, SubmitButton } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

/* Sign-out is a plain form POST so it works without JavaScript. */
export function AdminNav({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="type-mono hidden text-fg-subtle md:inline">
        {email}
      </span>
      <form action={logoutAction}>
        <Button type="submit" size="sm" variant="outline">
          <LogOut className="size-3.5" strokeWidth={2} />
          Sign out
        </Button>
      </form>
    </div>
  );
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    loginAction,
    idleState,
  );
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate className="space-y-5">
      <FormStatus status={state.status} message={state.message} />

      <input type="hidden" name="redirectTo" value={redirectTo} />

      <Field label="Email" htmlFor="email" required error={errors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          placeholder="you@example.com"
          invalid={Boolean(errors?.email)}
          aria-describedby="email-error"
        />
      </Field>

      <Field label="Password" htmlFor="password" required error={errors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={Boolean(errors?.password)}
          aria-describedby="password-error"
        />
      </Field>

      <LoginSubmit />
    </form>
  );
}

function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <div className="pt-1">
      <SubmitButton pending={pending} pendingLabel="Signing in" variant="accent" size="lg">
        Sign in
      </SubmitButton>
    </div>
  );
}
