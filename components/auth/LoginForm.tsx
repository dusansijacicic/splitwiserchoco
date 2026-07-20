"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const initialState: AuthActionState = { error: null };

export function LoginForm({ t }: { t: Dictionary["auth"] }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <Card className="p-6">
      <h1 className="mb-4 text-lg font-semibold">{t.login.title}</h1>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-muted">{t.login.email}</label>
          <Input type="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">{t.login.password}</label>
          <PasswordInput
            name="password"
            required
            autoComplete="current-password"
            showLabel={t.showPassword}
            hideLabel={t.hidePassword}
          />
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t.login.submitting : t.login.submit}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        {t.login.noAccount}{" "}
        <Link href="/signup" className="text-primary hover:underline">
          {t.login.signupLink}
        </Link>
      </p>
    </Card>
  );
}
