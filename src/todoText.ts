export type TextCursor = {
  text: string
  start: number
  end: number
}

function nextLetter(token: string): string {
  if (token === 'z') return 'aa'
  if (token === 'Z') return 'AA'
  if (token.length === 1) return String.fromCharCode(token.charCodeAt(0) + 1)
  return token
}

function letterAt(index: number): string {
  return String.fromCharCode(97 + (index % 26))
}

function selectedBlock(doc: TextCursor): { lineStart: number; lineEnd: number } {
  const { text, start, end } = doc
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  let lineEnd = text.indexOf('\n', Math.max(end - (end > start && text[end - 1] === '\n' ? 1 : 0), lineStart))
  if (end > start && text[end - 1] === '\n') {
    lineEnd = end - 1
  } else if (lineEnd === -1) {
    lineEnd = text.length
  }
  return { lineStart, lineEnd }
}

function stripList(line: string): { indent: string; rest: string; kind: 'bullet' | 'number' | 'letter' | null } {
  const bullet = line.match(/^( *)(?:- |\* |• )(.*)$/)
  if (bullet) return { indent: bullet[1], rest: bullet[2], kind: 'bullet' }
  const numbered = line.match(/^( *)(\d+)\. (.*)$/)
  if (numbered) return { indent: numbered[1], rest: numbered[3], kind: 'number' }
  const lettered = line.match(/^( *)([A-Za-z]+)\. (.*)$/)
  if (lettered) return { indent: lettered[1], rest: lettered[3], kind: 'letter' }
  const indent = line.match(/^( *)/)?.[1] ?? ''
  return { indent, rest: line.slice(indent.length), kind: null }
}

export function handleEnter(doc: TextCursor): TextCursor | null {
  const { text, start, end } = doc
  if (start !== end) return null

  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const lineEnd = text.indexOf('\n', start)
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd)
  const lineBefore = text.slice(lineStart, start)

  const bullet = lineBefore.match(/^( *)(- |\* |• )(.*)$/)
  const numbered = lineBefore.match(/^( *)(\d+)\. (.*)$/)
  const lettered = lineBefore.match(/^( *)([A-Za-z]+)\. (.*)$/)
  const match = bullet ?? numbered ?? lettered
  if (!match) return null

  const indent = match[1]
  const marker = bullet ? bullet[2] : numbered ? `${numbered[2]}. ` : `${lettered?.[2]}. `
  const afterMarker = line.slice(indent.length + marker.length)
  const empty = afterMarker.trim() === ''

  if (empty) {
    const next = text.slice(0, lineStart) + indent + text.slice(lineStart + indent.length + marker.length)
    return { text: next, start: lineStart + indent.length, end: lineStart + indent.length }
  }

  const nextMarker = bullet
    ? bullet[2]
    : numbered
      ? `${Number(numbered[2]) + 1}. `
      : `${nextLetter(lettered?.[2] ?? 'a')}. `
  const insert = `\n${indent}${nextMarker}`
  return {
    text: text.slice(0, start) + insert + text.slice(start),
    start: start + insert.length,
    end: start + insert.length,
  }
}

export function wrapSelection(doc: TextCursor, marker: string): TextCursor {
  const { text, start, end } = doc
  const selected = text.slice(start, end)
  const before = text.slice(Math.max(0, start - marker.length), start)
  const after = text.slice(end, end + marker.length)

  if (before === marker && after === marker) {
    return {
      text: text.slice(0, start - marker.length) + selected + text.slice(end + marker.length),
      start: start - marker.length,
      end: end - marker.length,
    }
  }

  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2) {
    const inner = selected.slice(marker.length, selected.length - marker.length)
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      start,
      end: start + inner.length,
    }
  }

  return {
    text: text.slice(0, start) + marker + selected + marker + text.slice(end),
    start: start + marker.length,
    end: end + marker.length,
  }
}

export function applyListKind(doc: TextCursor, kind: 'bullet' | 'number' | 'letter'): TextCursor {
  const { text } = doc
  const { lineStart, lineEnd } = selectedBlock(doc)
  const block = text.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const allHave = lines.every((line) => stripList(line).kind === kind)
  const next = lines
    .map((line, index) => {
      const { indent, rest } = stripList(line)
      if (allHave) return indent + rest
      if (kind === 'bullet') return `${indent}- ${rest}`
      if (kind === 'number') return `${indent}${index + 1}. ${rest}`
      return `${indent}${letterAt(index)}. ${rest}`
    })
    .join('\n')

  return {
    text: text.slice(0, lineStart) + next + text.slice(lineEnd),
    start: lineStart,
    end: lineStart + next.length,
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (typeof error === 'string' && error.trim()) return error
  return ''
}

export function looksLikeMissingTodoTable(error: unknown): boolean {
  return /todo_notes|schema cache|Could not find the table|PGRST205|42P01/i.test(errorMessage(error))
}

export function explainTodoWriteError(error: unknown, action: 'load' | 'save'): string {
  if (looksLikeMissingTodoTable(error)) {
    return action === 'load'
      ? 'Run the todo_notes SQL in Supabase, then refresh.'
      : 'Run the todo_notes SQL in Supabase, then tap Save.'
  }
  return errorMessage(error) || (action === 'load' ? 'Could not load your list.' : 'Could not save your list.')
}
