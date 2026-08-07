import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EyeIcon, EyeOffIcon } from '../icons'
import { getTextDirection } from '../../utils/rtl'

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <Label htmlFor={htmlFor} className="mb-1.5 text-sm font-medium text-muted-foreground">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
  )
}

export function TextField({
  label,
  required,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  dir,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  dir?: 'ltr' | 'rtl'
}) {
  const id = useId()
  // `dir` (if the caller passes one) is only the fallback for an empty
  // field — once there's real text, direction is decided by the value
  // itself, so a Persian-tab field with an English value still renders LTR
  // and vice versa.
  const resolvedDir = getTextDirection(value, dir)
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <Input
        id={id}
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} placeholder={placeholder} autoComplete={autoComplete} dir={resolvedDir}
        className={cn(resolvedDir === 'rtl' && 'rtl-text')}
      />
    </div>
  )
}

export function TextAreaField({
  label,
  required,
  value,
  onChange,
  rows = 3,
  placeholder,
  dir,
}: {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  dir?: 'ltr' | 'rtl'
}) {
  const id = useId()
  const resolvedDir = getTextDirection(value, dir)
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <Textarea
        id={id}
        value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder} dir={resolvedDir}
        className={cn('resize-none', resolvedDir === 'rtl' && 'rtl-text')}
      />
    </div>
  )
}

export function SelectField<T extends string>({
  label,
  required,
  value,
  onChange,
  options,
}: {
  label: string
  required?: boolean
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PasswordField({
  label,
  required,
  value,
  onChange,
  placeholder,
  autoComplete = 'new-password',
}: {
  label: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const id = useId()
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          required={required} autoComplete={autoComplete} placeholder={placeholder}
          className="pe-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setShow((v) => !v)}
          className="absolute end-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
    </div>
  )
}
