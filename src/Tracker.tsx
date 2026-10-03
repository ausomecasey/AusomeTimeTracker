import { useEffect, useState } from 'react'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  formatDayHeading,
  formatHours,
  hoursToInput,
  parseHours,
  rangeForTotals,
  sanitizeHoursInput,
  startOfMonth,
  startOfWeek,
  sumHours,
  todayISO,
} from './dates'
import type { Entry, EntryStore } from './types'

type TrackerProps = {
  store: EntryStore
  onSignOut?: () => void
}

function validate(hours: string, note: string): string {
  if (!hours) return 'Enter the number of hours.'
  if (parseHours(hours) === null) return 'Use a number greater than 0, with at most one decimal place.'
  if (note.trim().length > 200) return 'Keep the note under 200 characters.'
  return ''
}

export function Tracker({ store, onSignOut }: TrackerProps) {
  const today = todayISO()
  const [day, setDay] = useState(today)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [hours, setHours] = useState('')
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    const { from, to } = rangeForTotals(day)
    setLoading(true)
    setLoadError('')

    store
      .load(from, to)
      .then((rows) => {
        if (!cancelled) setEntries(rows)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setEntries([])
          setLoadError(error instanceof Error ? error.message : 'Could not load hours.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [day, reloadKey, store])

  function resetForm() {
    setHours('')
    setNote('')
    setEditingId(null)
    setFormError('')
    setConfirmDelete(false)
  }

  function selectDay(next: string) {
    setDay(next)
    resetForm()
  }

  function selectEntry(entry: Entry) {
    setEditingId(entry.id)
    setHours(hoursToInput(entry.hours))
    setNote(entry.note ?? '')
    setFormError('')
    setConfirmDelete(false)
  }

  async function save() {
    const message = validate(hours, note)
    const parsedHours = parseHours(hours)
    if (message || parsedHours === null) {
      setFormError(message || 'Use a number greater than 0, with at most one decimal place.')
      return
    }

    setSaving(true)
    setFormError('')
    const draft = { work_date: day, hours: parsedHours, note }
    try {
      if (editingId) await store.update(editingId, draft)
      else await store.create(draft)
      resetForm()
      setReloadKey((value) => value + 1)
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Could not save that entry.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!editingId) return
    setSaving(true)
    setFormError('')
    try {
      await store.remove(editingId)
      resetForm()
      setReloadKey((value) => value + 1)
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Could not delete that entry.')
    } finally {
      setSaving(false)
    }
  }

  const dayEntries = entries.filter((entry) => entry.work_date === day)

  const dayTotal = sumHours(entries, day, day)
  const weekTotal = sumHours(entries, startOfWeek(day), endOfWeek(day))
  const monthTotal = sumHours(entries, startOfMonth(day), endOfMonth(day))

  return (
    <main className="app">
      <header className="top">
        <div className="brand-row">
          <p className="brand">
            <span className="brand-swatches" aria-hidden="true">
              <i className="navy" />
              <i className="orange" />
            </span>
            Ausome Time Tracker
          </p>
          {onSignOut ? (
            <button className="linkish" type="button" onClick={onSignOut}>
              Sign out
            </button>
          ) : null}
        </div>
        <div className="date-nav">
          <button className="icon-btn" type="button" onClick={() => selectDay(addDays(day, -1))} aria-label="Previous day">
            ‹
          </button>
          <label className="date-label">
            <span>{formatDayHeading(day, today)}</span>
            <input
              type="date"
              value={day}
              aria-label="Choose a day"
              onChange={(event) => {
                if (event.target.value) selectDay(event.target.value)
              }}
            />
          </label>
          <button className="icon-btn" type="button" onClick={() => selectDay(addDays(day, 1))} aria-label="Next day">
            ›
          </button>
        </div>
        {day !== today ? (
          <button className="today" type="button" onClick={() => selectDay(today)}>
            Today
          </button>
        ) : null}
        <dl className="totals" aria-live="polite">
          <div>
            <dt>Day</dt>
            <dd>{formatHours(dayTotal)}</dd>
          </div>
          <div>
            <dt>Week</dt>
            <dd>{formatHours(weekTotal)}</dd>
          </div>
          <div>
            <dt>Month</dt>
            <dd>{formatHours(monthTotal)}</dd>
          </div>
        </dl>
      </header>

      {loadError ? <p className="banner">{loadError}</p> : null}
      {loading ? <p className="empty">Loading hours…</p> : null}
      {!loading && dayEntries.length === 0 ? <p className="empty">No hours for this day yet.</p> : null}

      <ul className="entries">
        {dayEntries.map((entry) => (
          <li key={entry.id}>
            <button
              className={entry.id === editingId ? 'entry selected' : 'entry'}
              type="button"
              onClick={() => selectEntry(entry)}
            >
              <span className="entry-hours">{formatHours(entry.hours)}</span>
              {entry.note ? <span className="entry-note">{entry.note}</span> : null}
            </button>
          </li>
        ))}
      </ul>

      <section className="form" aria-label={editingId ? 'Edit entry' : 'Add entry'}>
        <h2>{editingId ? 'Edit entry' : 'Add entry'}</h2>
        <label>
          <span>Hours</span>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={hours}
            placeholder="0.0"
            onChange={(event) => setHours(sanitizeHoursInput(event.target.value))}
          />
        </label>
        <label>
          <span>Note</span>
          <input
            type="text"
            value={note}
            maxLength={200}
            placeholder="Optional"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {formError ? <p className="form-error">{formError}</p> : null}
        <button className="primary" type="button" onClick={save} disabled={saving}>
          {editingId ? 'Save' : 'Add hours'}
        </button>
        {editingId ? (
          confirmDelete ? (
            <div className="row-actions">
              <button className="danger" type="button" onClick={remove} disabled={saving}>
                Delete this entry
              </button>
              <button className="ghost" type="button" onClick={() => setConfirmDelete(false)} disabled={saving}>
                Keep
              </button>
            </div>
          ) : (
            <div className="row-actions">
              <button className="ghost" type="button" onClick={resetForm} disabled={saving}>
                Cancel
              </button>
              <button className="danger" type="button" onClick={() => setConfirmDelete(true)} disabled={saving}>
                Delete
              </button>
            </div>
          )
        ) : null}
      </section>
    </main>
  )
}
