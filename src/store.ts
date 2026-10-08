import type { SupabaseClient } from '@supabase/supabase-js'
import type { Entry, EntryDraft, EntryStore, TodoStore } from './types'

const TODO_CACHE_KEY = 'ausome-todo-list'

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
      return { body: data?.body ?? '' }
    },
    async save(body) {
      const stamp = new Date().toISOString()
      const { data, error: updateError } = await client
        .from('todo_notes')
        .update({ body, updated_at: stamp })
        .select('user_id')
      if (updateError) throw updateError
      if (data && data.length > 0) return

      const { error: insertError } = await client.from('todo_notes').insert({ body, updated_at: stamp })
      if (!insertError) return

      const { data: retry, error: retryError } = await client
        .from('todo_notes')
        .update({ body, updated_at: stamp })
        .select('user_id')
      if (retryError || !retry?.length) throw insertError
    },
  }
}

export function createMemoryTodoStore(): TodoStore {
  let body = ''

  return {
    async load() {
      return { body }
    },
    async save(next) {
      body = next
    },
  }
}

export function withLocalTodoCache(store: TodoStore, key = TODO_CACHE_KEY): TodoStore {
  return {
    async load() {
      const cached = window.localStorage.getItem(key)
      try {
        const result = await store.load()
        if (!result.body && cached) {
          try {
            await store.save(cached)
          } catch {
            return { body: cached }
          }
          return { body: cached }
        }
        window.localStorage.setItem(key, result.body)
        return result
      } catch (error) {
        if (cached === null) throw error
        return {
          body: cached,
          warning:
            error instanceof Error
              ? `${error.message} Showing the last copy saved on this device.`
              : 'Could not reach the server. Showing the last copy saved on this device.',
        }
      }
    },
    async save(body) {
      window.localStorage.setItem(key, body)
      await store.save(body)
    },
  }
}
