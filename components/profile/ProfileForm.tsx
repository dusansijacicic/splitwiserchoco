"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const initialState: ActionState = { error: null };

export function ProfileForm({
  email,
  displayName,
  t,
}: {
  email: string;
  displayName: string;
  t: Dictionary["profile"];
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [justSaved, setJustSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setJustSaved(true);
      const timeout = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-muted">{t.email}</label>
        <Input type="email" value={email} disabled className="bg-gray-50 text-muted" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-muted">{t.name}</label>
        <Input type="text" name="displayName" required defaultValue={displayName} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {justSaved && <p className="text-sm text-owed">{t.saved}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t.saving : t.save}
      </Button>
    </form>
  );
}
