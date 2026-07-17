import { Badge } from './ui'
import { titleCase } from '@/lib/format'

// Maps a bankd status string to a toned pill. Covers account/kyc/tx/wallet/card
// /compliance vocabularies.
const tone: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'neutral'> = {
  // positive
  active: 'success', approved: 'success', completed: 'success', cleared: 'success', low: 'success',
  // in-flight
  processing: 'info', provisioning: 'info', pending: 'warning', not_started: 'muted', open: 'warning', medium: 'warning',
  // negative
  failed: 'danger', rejected: 'danger', suspended: 'danger', frozen: 'info', escalated: 'danger', high: 'danger',
  cancelled: 'muted', closed: 'muted',
}

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const t = tone[status] ?? 'neutral'
  return (
    <Badge tone={t} dot={dot}>
      {titleCase(status)}
    </Badge>
  )
}
