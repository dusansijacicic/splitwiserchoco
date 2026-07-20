"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <Card className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Registracija</h1>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Ime</label>
          <Input type="text" name="displayName" required autoComplete="name" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Email</label>
          <Input type="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Lozinka</label>
          <PasswordInput
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Kreiranje naloga..." : "Registruj se"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Već imaš nalog?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Prijavi se
        </Link>
      </p>
    </Card>
  );
}
