"use client";

import { useActionState } from "react";
import { createGroup, type ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const initialState: ActionState = { error: null };

export function NewGroupForm({ t }: { t: Dictionary["groups"] }) {
  const [state, formAction, pending] = useActionState(createGroup, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-muted">{t.groupName}</label>
        <Input type="text" name="name" required placeholder={t.groupNamePlaceholder} />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.creating : t.create}
      </Button>
    </form>
  );
}
