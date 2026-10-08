import type { SupabaseClient } from '@supabase/supabase-js'
import type { Entry, EntryDraft, EntryStore, TodoStore } from './types'

function noteOrNull(note: string): string | null {
  const trimmed = note.trim()
  return trimmed ? trimmed : null
}

function toEntry(row: {
  id: string
  work_date: string
  hours: number | string
  note: string | null
}): Entry {
  return {
    id: row.id,
    work_date: row.work_date,
    hours: Math.round(Number(row.hours) * 10) / 10,
    note: row.note,
  }
}

export function createSupabaseStore(client: SupabaseClient): EntryStore {
  return {
    async load(from, to) {
      const { data, error } = await client
        .from('entries')
        .select('id, work_date, hours, note')
        .gte('work_date', from)
        .lte('work_date', to)
        .order('created_at')
      if (error) throw error
      return (data ?? []).map((row) => toEntry(row))
    },
    async create(draft) {
      const { error } = await client.from('entries').insert({
        work_date: draft.work_date,
        hours: draft.hours,
        note: noteOrNull(draft.note),
      })
      if (error) throw error
    },
    async update(id, draft) {
      const { error } = await client
        .from('entries')
        .update({
          work_date: draft.work_date,
          hours: draft.hours,
          note: noteOrNull(draft.note),
        })
        .eq('id', id)
      if (error) throw error
    },
    async remove(id) {
      const { error } = await client.from('entries').delete().eq('id', id)
      if (error) throw error
    },
  }
}

export function createMemoryStore(): EntryStore {
  let entries: Entry[] = []

  return {
    async load(from, to) {
      return entries.filter((entry) => entry.work_date >= from && entry.work_date <= to)
    },
    async create(draft: EntryDraft) {
      entries = [
        ...entries,
        {
          id: crypto.randomUUID(),
          work_date: draft.work_date,
          hours: draft.hours,
          note: noteOrNull(draft.note),
        },
      ]
    },
    async update(id, draft) {
      entries = entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              work_date: draft.work_date,
              hours: draft.hours,
              note: noteOrNull(draft.note),
            }
          : entry,
      )
    },
    async remove(id) {
      entries = entries.filter((entry) => entry.id !== id)
    },
  }
}

export function createSupabaseTodoStore(client: SupabaseClient): TodoStore {
  return {
    async load() {
      const { data, error } = await client.from('todo_notes').select('body').maybeSingle()
      if (error) throw error
      return data?.body ?? ''
    },
    async save(body) {
      const { data: userResult, error: userError } = await client.auth.getUser()
      if (userError) throw userError
      const user = userResult.user
      if (!user) throw new Error('Sign in to save your list.')
      const { error } = await client.from('todo_notes').upsert({
        user_id: user.id,
        body,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
  }
}

export function createMemoryTodoStore(): TodoStore {
  let body = ''

  return {
    async load() {
      return body
    },
    async save(next) {
      body = next
    },
  }
}
