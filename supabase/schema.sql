create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  work_date date not null,
  hours numeric(3,1) not null,
  note text,
  created_at timestamptz not null default now(),
  constraint entries_hours_positive check (hours > 0),
  constraint entries_note_length check (note is null or char_length(note) <= 200)
);

create index entries_user_date_idx
  on public.entries (user_id, work_date);

alter table public.entries enable row level security;

revoke all on table public.entries from anon, public;
grant select, insert, update, delete on table public.entries to authenticated;

create policy "entries_select_own"
  on public.entries
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "entries_insert_own"
  on public.entries
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "entries_update_own"
  on public.entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "entries_delete_own"
  on public.entries
  for delete
  to authenticated
  using (user_id = auth.uid());

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
