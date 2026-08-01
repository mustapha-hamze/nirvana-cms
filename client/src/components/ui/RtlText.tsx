import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { rtlTextProps } from '../../utils/rtl'

// Display wrapper for read-only preview text (list rows, collapsed
// section/component headers, ...) that should render RTL when it contains
// Persian/Arabic/Urdu script. `text` is the actual string checked for RTL
// script; `children` is what's rendered (usually the same string, but kept
// separate so a caller can wrap richer content while still detecting off the
// plain-text value).
export default function RtlText({
  text,
  children,
  className,
}: {
  text: unknown
  children: ReactNode
  className?: string
}) {
  const { dir, className: rtlClassName } = rtlTextProps(text)
  return (
    <span dir={dir} className={cn(rtlClassName, className)}>
      {children}
    </span>
  )
}
