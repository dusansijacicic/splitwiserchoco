-- Row Level Security policies.

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_participants enable row level security;
alter table settlements enable row level security;

-- Helper: is the current user a member of the given group?
-- security definer so it can read group_members without recursive RLS evaluation.
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

grant execute on function is_group_member(uuid) to authenticated;

-- Helper: exact-match email lookup without exposing a broad profiles.email SELECT policy.
create or replace function find_profile_by_email(lookup_email text)
returns setof profiles
language sql
security definer
set search_path = public
stable
as $$
  select * from profiles where email = lookup_email;
$$;

grant execute on function find_profile_by_email(text) to authenticated;

-- profiles
create policy "profiles are readable by any authenticated user"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- groups
create policy "members can read their groups"
  on groups for select
  to authenticated
  using (is_group_member(id));

create policy "authenticated users can create groups"
  on groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "owner can update their group"
  on groups for update
  to authenticated
  using (created_by = auth.uid());

create policy "owner can delete their group"
  on groups for delete
  to authenticated
  using (created_by = auth.uid());

-- group_members
create policy "members can read group membership"
  on group_members for select
  to authenticated
  using (is_group_member(group_id));

create policy "members can add new members"
  on group_members for insert
  to authenticated
  with check (is_group_member(group_id));

create policy "members can remove themselves or owner can remove anyone"
  on group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from groups
      where groups.id = group_members.group_id
        and groups.created_by = auth.uid()
    )
  );

-- expenses
create policy "members can read group expenses"
  on expenses for select
  to authenticated
  using (is_group_member(group_id));

create policy "members can add expenses paid by a group member"
  on expenses for insert
  to authenticated
  with check (
    is_group_member(group_id)
    and exists (
      select 1 from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = expenses.paid_by
    )
  );

create policy "creator can delete their expense"
  on expenses for delete
  to authenticated
  using (created_by = auth.uid());

-- expense_participants
create policy "members can read expense participants"
  on expense_participants for select
  to authenticated
  using (
    is_group_member((select group_id from expenses where id = expense_participants.expense_id))
  );

create policy "members can add participants to their group's expenses"
  on expense_participants for insert
  to authenticated
  with check (
    is_group_member((select group_id from expenses where id = expense_participants.expense_id))
  );

-- settlements
create policy "members can read group settlements"
  on settlements for select
  to authenticated
  using (is_group_member(group_id));

create policy "members can record settlements"
  on settlements for insert
  to authenticated
  with check (is_group_member(group_id) and created_by = auth.uid());
