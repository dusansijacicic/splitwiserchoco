"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: ActionState = { error: null };

export function ProfileForm({ email, displayName }: { email: string; displayName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [justSaved, setJustSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-muted">Email</label>
        <Input type="email" value={email} disabled className="bg-gray-50 text-muted" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">Ime</label>
        <Input type="text" name="displayName" required defaultValue={displayName} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {justSaved && <p className="text-sm text-owed">Sačuvano.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
