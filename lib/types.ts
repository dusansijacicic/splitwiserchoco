// Supabase-js (without generated Database types) can't infer whether an
// embedded relation is to-one or to-many, so it types it as an array.
// This normalizes either shape to a single row or null.
export function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: "owner" | "member";
  joined_at: string;
  profile?: Profile | null;
};

export type Expense = {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  created_by: string;
  expense_date: string;
  created_at: string;
};

export type ExpenseParticipant = {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
};

export type Settlement = {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  currency: string;
  created_by: string;
  settled_at: string;
};
