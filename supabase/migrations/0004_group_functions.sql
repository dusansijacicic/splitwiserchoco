-- RPCs that need to bypass RLS for a single atomic step, with authorization
-- enforced explicitly inside the function body (never trust bare input).

-- Creates a group and adds the creator as owner in one transaction.
-- security definer is required because the group_members insert policy
-- requires is_group_member(group_id), which isn't true yet for a brand new group.
create or replace function create_group(group_name text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  new_group groups;
begin
  insert into groups (name, created_by)
  values (group_name, auth.uid())
  returning * into new_group;

  insert into group_members (group_id, user_id, role)
  values (new_group.id, auth.uid(), 'owner');

  return new_group;
end;
$$;

grant execute on function create_group(text) to authenticated;

-- Adds a member to a group by email: an existing profile if found,
-- otherwise an invited_email placeholder row backfilled at signup.
create or replace function add_member_by_email(p_group_id uuid, p_email text)
returns group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile profiles;
  new_member group_members;
begin
  if not is_group_member(p_group_id) then
    raise exception 'not a member of this group';
  end if;

  select * into target_profile from profiles where email = p_email;

  if target_profile.id is not null then
    insert into group_members (group_id, user_id)
    values (p_group_id, target_profile.id)
    returning * into new_member;
  else
    insert into group_members (group_id, invited_email)
    values (p_group_id, p_email)
    returning * into new_member;
  end if;

  return new_member;
end;
$$;

grant execute on function add_member_by_email(uuid, text) to authenticated;
