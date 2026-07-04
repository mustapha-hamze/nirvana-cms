import { theme } from '../../theme'

export default function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ background: theme.accentGradientDiag }}
    >
      {initials}
    </div>
  )
}
