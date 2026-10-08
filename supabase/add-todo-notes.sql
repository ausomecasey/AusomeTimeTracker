-- One-time: run this in the Supabase SQL editor for the existing project.
-- It adds a single master to-do list per signed-in user.

create table public.todo_notes (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.todo_notes enable row level security;

revoke all on table public.todo_notes from anon, public;
grant select, insert, update on table public.todo_notes to authenticated;

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
