-- Allows the expense creator to edit an expense (description, amount,
-- currency, payer, date, and full participant shares), mirroring the
-- existing creator-only delete policy.

create policy "creator can update their expense"
  on expenses for update
  to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and is_group_member(group_id)
    and exists (
      select 1 from group_members
      where group_members.group_id = expenses.group_id
        and group_members.user_id = expenses.paid_by
    )
  );

create policy "creator can delete participants of their expense"
  on expense_participants for delete
  to authenticated
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_participants.expense_id
        and expenses.created_by = auth.uid()
    )
  );

-- Replaces an expense's description/amount/currency/payer/date and its
-- entire participant share set atomically. Runs as invoker: the RLS
-- policies above (update on expenses, delete+insert on expense_participants)
-- already restrict this to the expense's original creator.
create or replace function update_expense_with_shares(
  p_expense_id uuid,
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
  updated_expense expenses;
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

  update expenses
  set description = p_description,
      amount = p_amount,
      currency = p_currency,
      paid_by = p_paid_by,
      expense_date = p_expense_date
  where id = p_expense_id
  returning * into updated_expense;

  if updated_expense.id is null then
    raise exception 'expense not found or not permitted';
  end if;

  delete from expense_participants where expense_id = p_expense_id;

  for share in select * from jsonb_array_elements(p_shares) loop
    insert into expense_participants (expense_id, user_id, share_amount)
    values (
      p_expense_id,
      (share ->> 'user_id')::uuid,
      (share ->> 'share_amount')::numeric
    );
  end loop;

  return updated_expense;
end;
$$;

grant execute on function update_expense_with_shares(
  uuid, text, numeric, text, uuid, date, jsonb
) to authenticated;
