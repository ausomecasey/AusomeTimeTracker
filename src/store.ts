import type { SupabaseClient } from '@supabase/supabase-js'
import { errorMessage } from './todoText'
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

function throwStoreError(error: unknown, fallback: string): never {
  throw new Error(errorMessage(error) || fallback)
}

export function createSupabaseTodoStore(client: SupabaseClient): TodoStore {
  return {
    async load() {
      const { data: sessionData } = await client.auth.getSession()
      const userId = sessionData.session?.user.id
      let query = client.from('todo_notes').select('body')
      if (userId) query = query.eq('user_id', userId)
      const { data, error } = await query.maybeSingle()
      if (error) throwStoreError(error, 'Could not load your list.')
      return { body: data?.body ?? '' }
    },
    async save(body) {
      const { data: sessionData, error: sessionError } = await client.auth.getSession()
      if (sessionError) throwStoreError(sessionError, 'Sign in to save your list.')
      const userId = sessionData.session?.user.id
      if (!userId) throw new Error('Sign in to save your list.')

      const stamp = new Date().toISOString()
      const { error } = await client.from('todo_notes').upsert(
        { user_id: userId, body, updated_at: stamp },
        { onConflict: 'user_id' },
      )
      if (error) throwStoreError(error, 'Could not save your list.')
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
          warning: `${errorMessage(error) || 'Could not reach the server.'} Showing the last copy saved on this device.`,
        }
      }
    },
    async save(body) {
      window.localStorage.setItem(key, body)
      await store.save(body)
    },
  }
}
