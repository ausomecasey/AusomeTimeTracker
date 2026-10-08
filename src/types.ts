export type Entry = {
  id: string
  work_date: string
  hours: number
  note: string | null
}

export type EntryDraft = {
  work_date: string
  hours: number
  note: string
}

export type EntryStore = {
  load(from: string, to: string): Promise<Entry[]>
  create(draft: EntryDraft): Promise<void>
  update(id: string, draft: EntryDraft): Promise<void>
  remove(id: string): Promise<void>
}

export type TodoStore = {
  load(): Promise<string>
  save(body: string): Promise<void>
}
