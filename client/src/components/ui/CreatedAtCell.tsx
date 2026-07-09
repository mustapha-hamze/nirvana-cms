import { theme } from '../../theme'

export default function CreatedAtCell({ date }: { date: string }) {
  const formatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <td className="px-5 py-3" style={{ color: theme.textTertiary }}>
      {formatted}
    </td>
  )
}
