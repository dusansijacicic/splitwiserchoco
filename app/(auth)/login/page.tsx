"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <Card className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Prijava</h1>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Email</label>
          <Input type="email" name="email" required autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Lozinka</label>
          <Input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Prijavljivanje..." : "Prijavi se"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Nemaš nalog?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Registruj se
        </Link>
      </p>
    </Card>
  );
}
