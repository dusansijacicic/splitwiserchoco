"use client";

import { useActionState } from "react";
import { addMember, type ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: ActionState = { error: null };

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, formAction, pending] = useActionState(
    addMember.bind(null, groupId),
    initialState
  );

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <Input type="email" name="email" required placeholder="email@primer.com" />
        {state.error && <p className="mt-1 text-sm text-danger">{state.error}</p>}
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Dodavanje..." : "Dodaj"}
      </Button>
    </form>
  );
}
