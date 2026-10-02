-- Run this if the entries table was already created with start_time and end_time.
alter table public.entries drop constraint if exists entries_end_after_start;
alter table public.entries drop column if exists start_time;
alter table public.entries drop column if exists end_time;

alter table public.entries add column if not exists hours numeric(3,1);
alter table public.entries alter column hours set not null;

alter table public.entries drop constraint if exists entries_hours_positive;
alter table public.entries
  add constraint entries_hours_positive check (hours > 0);
