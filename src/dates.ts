export type ISODate = string

export function todayISO(now = new Date()): ISODate {
  return toISODate(now)
}

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(value: ISODate): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function startOfWeek(value: ISODate): ISODate {
  const date = parseISODate(value)
  const weekday = date.getDay()
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1
  date.setDate(date.getDate() - daysFromMonday)
  return toISODate(date)
}

export function endOfWeek(value: ISODate): ISODate {
  return addDays(startOfWeek(value), 6)
}

export function startOfMonth(value: ISODate): ISODate {
  const date = parseISODate(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function endOfMonth(value: ISODate): ISODate {
  const date = parseISODate(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
}

export function rangeForTotals(value: ISODate): { from: ISODate; to: ISODate } {
  const weekStart = startOfWeek(value)
  const weekEnd = endOfWeek(value)
  const monthStart = startOfMonth(value)
  const monthEnd = endOfMonth(value)
  return {
    from: weekStart < monthStart ? weekStart : monthStart,
    to: weekEnd > monthEnd ? weekEnd : monthEnd,
  }
}

export function sanitizeHoursInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (!cleaned) return ''

  const dot = cleaned.indexOf('.')
  const wholeRaw = dot === -1 ? cleaned : cleaned.slice(0, dot)
  const fractionRaw = dot === -1 ? '' : cleaned.slice(dot + 1).replace(/\./g, '')
  let whole = wholeRaw.replace(/^0+(?=\d)/, '').slice(0, 2)
  if (dot !== -1 && whole === '') whole = '0'
  if (dot === -1) return whole
  return `${whole}.${fractionRaw.slice(0, 1)}`
}

export function parseHours(value: string): number | null {
  const normalized = value.endsWith('.') ? value.slice(0, -1) : value
  if (!/^\d+(\.\d)?$/.test(normalized)) return null
  const hours = Math.round(Number(normalized) * 10) / 10
  if (!Number.isFinite(hours) || hours <= 0 || hours > 99.9) return null
  return hours
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${text}h`
}

export function hoursToInput(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function formatDayHeading(value: ISODate, today: ISODate): string {
  const sameYear = value.slice(0, 4) === today.slice(0, 4)
  return parseISODate(value).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}

export function sumHours(
  entries: { work_date: string; hours: number }[],
  from: ISODate,
  to: ISODate,
): number {
  const total = entries.reduce((sum, entry) => {
    if (entry.work_date < from || entry.work_date > to) return sum
    return sum + entry.hours
  }, 0)
  return Math.round(total * 10) / 10
}
