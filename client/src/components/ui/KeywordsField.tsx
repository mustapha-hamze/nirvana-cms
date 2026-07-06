import { useState } from 'react'
import { theme } from '../../theme'
import { CloseIcon } from '../icons'

// Free-form tag input for SEO keywords — shared by ContentForm and PageForm's
// SEO & Metadata sections (both store the same { keywords, author, description }
// shape). Enter or comma commits the current input as a tag; Backspace on an
// empty input pops the last one.
export default function KeywordsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')

  function commit() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
        Keywords
      </label>
      <div
        className="w-full px-3 py-2 rounded-xl flex flex-wrap items-center gap-1.5"
        style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}
      >
        {value.map((kw) => (
          <span
            key={kw}
            className="flex items-center gap-1 text-xs font-medium pl-2 pr-1.5 py-1 rounded-full"
            style={{ background: theme.accentBg, color: theme.accent }}
          >
            {kw}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== kw))} className="leading-none">
              <CloseIcon size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Type a keyword and press Enter…' : ''}
          className="flex-1 min-w-24 bg-transparent outline-none text-sm py-1"
          style={{ color: theme.textPrimary }}
        />
      </div>
    </div>
  )
}
