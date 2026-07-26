import { useId, useState } from 'react'
import { theme } from '../../theme'
import { EyeIcon, EyeOffIcon } from '../icons'

const inputStyle = { background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.textPrimary }

function focusBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(124,58,237,0.7)'
}
function blurBorder(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = theme.inputBorder
}

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5" style={{ color: theme.textSecondary }}>
      {label} {required && <span style={{ color: theme.danger }}>*</span>}
    </label>
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
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        required={required} placeholder={placeholder} autoComplete={autoComplete} dir={dir}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
        style={inputStyle}
        onFocus={focusBorder} onBlur={blurBorder}
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
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        value={value} onChange={(e) => onChange(e.target.value)}
        rows={rows} placeholder={placeholder} dir={dir}
        className="w-full px-4 py-2.5 rounded-xl text-sm resize-none outline-none transition"
        style={inputStyle}
        onFocus={focusBorder} onBlur={blurBorder}
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
      <select
        id={id}
        value={value} onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
        style={inputStyle}
        onFocus={focusBorder} onBlur={blurBorder}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: theme.inputBg }}>
            {opt.label}
          </option>
        ))}
      </select>
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
        <input
          id={id}
          type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          required={required} autoComplete={autoComplete} placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm outline-none transition"
          style={inputStyle}
          onFocus={focusBorder} onBlur={blurBorder}
        />
        <button
          type="button" onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
          style={{ color: theme.textFaint }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.textSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.textFaint)}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}
