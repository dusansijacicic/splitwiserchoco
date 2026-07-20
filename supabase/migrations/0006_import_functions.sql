-- Inserts an expense with explicit, caller-supplied per-participant shares
-- (used by CSV import, where the source spreadsheet already has the split
-- worked out per person, e.g. "Šiki" / "Dixie" columns).
create or replace function create_expense_with_exact_shares(
  p_group_id uuid,
  p_description text,
  p_amount numeric,
  p_currency text,
  p_paid_by uuid,
  p_expense_date date,
  p_shares jsonb -- [{ "user_id": "...", "share_amount": 12.34 }, ...]
)
returns expenses
language plpgsql
as $$
declare
  new_expense expenses;
  share jsonb;
  share_total numeric(12, 2) := 0;
begin
  if jsonb_array_length(p_shares) = 0 then
    raise exception 'at least one participant share is required';
  end if;

  for share in select * from jsonb_array_elements(p_shares) loop
    share_total := share_total + (share ->> 'share_amount')::numeric;
  end loop;

  if abs(share_total - p_amount) > 0.02 then
    raise exception 'participant shares (%) do not add up to the expense amount (%)',
      share_total, p_amount;
  end if;

  insert into expenses (group_id, description, amount, currency, paid_by, created_by, expense_date)
  values (p_group_id, p_description, p_amount, p_currency, p_paid_by, auth.uid(), p_expense_date)
  returning * into new_expense;

  for share in select * from jsonb_array_elements(p_shares) loop
    insert into expense_participants (expense_id, user_id, share_amount)
    values (
      new_expense.id,
      (share ->> 'user_id')::uuid,
      (share ->> 'share_amount')::numeric
    );
  end loop;

  return new_expense;
end;
$$;

grant execute on function create_expense_with_exact_shares(
  uuid, text, numeric, text, uuid, date, jsonb
) to authenticated;
