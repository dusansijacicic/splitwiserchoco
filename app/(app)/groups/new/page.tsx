"use client";

import { useActionState } from "react";
import { createGroup, type ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const initialState: ActionState = { error: null };

export default function NewGroupPage() {
  const [state, formAction, pending] = useActionState(createGroup, initialState);

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Nova grupa</h1>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Ime grupe</label>
          <Input type="text" name="name" required placeholder="npr. Stan, Put u Grčku" />
        </div>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Kreiranje..." : "Kreiraj grupu"}
        </Button>
      </form>
    </Card>
  );
}
