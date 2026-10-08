-- Safe to re-run. The table already exists; this only repairs columns, grants, and policies.

alter table public.todo_notes add column if not exists body text not null default '';
alter table public.todo_notes add column if not exists updated_at timestamptz not null default now();

alter table public.todo_notes enable row level security;

grant select, insert, update on table public.todo_notes to authenticated;

drop policy if exists "todo_notes_select_own" on public.todo_notes;
drop policy if exists "todo_notes_insert_own" on public.todo_notes;
drop policy if exists "todo_notes_update_own" on public.todo_notes;

create policy "todo_notes_select_own"
  on public.todo_notes
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "todo_notes_insert_own"
  on public.todo_notes
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "todo_notes_update_own"
  on public.todo_notes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
