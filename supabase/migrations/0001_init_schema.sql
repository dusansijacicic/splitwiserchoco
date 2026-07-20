-- Core schema for the Splitwise clone MVP.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  invited_email text,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id),
  constraint group_members_identity_check check (
    (user_id is not null and invited_email is null) or
    (user_id is null and invited_email is not null)
  )
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  paid_by uuid not null references profiles(id),
  created_by uuid not null references profiles(id),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id uuid not null references profiles(id),
  share_amount numeric(12, 2) not null check (share_amount >= 0),
  unique (expense_id, user_id)
);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  paid_by uuid not null references profiles(id),
  paid_to uuid not null references profiles(id),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  created_by uuid not null references profiles(id),
  settled_at timestamptz not null default now()
);

create index on group_members (group_id);
create index on group_members (user_id);
create index on group_members (invited_email);
create index on expenses (group_id);
create index on expense_participants (expense_id);
create index on expense_participants (user_id);
create index on settlements (group_id);
