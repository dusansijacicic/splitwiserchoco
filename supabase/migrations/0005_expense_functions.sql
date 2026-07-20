-- Atomically inserts an expense plus its per-participant equal-split shares.
-- Runs as invoker (not security definer): existing RLS policies on
-- `expenses`/`expense_participants` already authorize this correctly for
-- any caller who is a member of the group, so no privilege escalation needed.
create or replace function create_expense_with_splits(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_currency text,
  p_paid_by uuid,
  p_expense_date date,
  p_participant_ids uuid[]
)
returns expenses
language plpgsql
as $$
declare
  new_expense expenses;
  participant_count int;
  base_share numeric(12, 2);
  remainder_cents int;
  pid uuid;
  idx int := 0;
begin
  participant_count := array_length(p_participant_ids, 1);
  if participant_count is null or participant_count = 0 then
    raise exception 'at least one participant is required';
  end if;

  insert into expenses (group_id, description, amount, currency, paid_by, created_by, expense_date)
  values (p_group_id, p_description, p_amount, p_currency, p_paid_by, auth.uid(), p_expense_date)
  returning * into new_expense;

  -- floor to the cent, then hand out the leftover pennies one at a time
  -- so the shares always sum back up exactly to the total amount.
  base_share := floor((p_amount / participant_count) * 100) / 100;
  remainder_cents := round((p_amount - base_share * participant_count) * 100);

  foreach pid in array p_participant_ids loop
    idx := idx + 1;
    insert into expense_participants (expense_id, user_id, share_amount)
    values (
      new_expense.id,
      pid,
      base_share + case when idx <= remainder_cents then 0.01 else 0 end
    );
  end loop;

  return new_expense;
end;
$$;

grant execute on function create_expense_with_splits(
  uuid, text, numeric, text, uuid, date, uuid[]
) to authenticated;
