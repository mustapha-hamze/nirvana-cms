import { useId, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CloseIcon } from '../icons'

// Free-form tag input for SEO keywords — shared by ContentForm and PageForm's
// SEO & Metadata sections (both store the same { keywords, author, description }
// shape). Enter or comma commits the current input as a tag; Backspace on an
// empty input pops the last one.
export default function KeywordsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')
  const id = useId()

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
      <Label htmlFor={id} className="mb-1.5 text-sm font-medium text-muted-foreground">
        Keywords
      </Label>
      <div className="flex w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 shadow-xs dark:bg-input/30">
        {value.map((kw) => (
          <Badge key={kw} variant="accent" className="gap-1 py-1 pr-1.5 pl-2 text-xs">
            {kw}
            <button type="button" onClick={() => onChange(value.filter((k) => k !== kw))} className="leading-none">
              <CloseIcon size={11} />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Type a keyword and press Enter…' : ''}
          className="min-w-24 flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
