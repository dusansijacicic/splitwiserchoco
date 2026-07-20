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
