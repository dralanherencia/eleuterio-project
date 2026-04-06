import type { Client } from '../../types'

interface Props {
  client: Client
  size?: 'sm' | 'md'
}

export function ClientChip({ client, size = 'md' }: Props) {
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px}`}
      style={{ backgroundColor: client.color + '20', color: client.color, border: `1px solid ${client.color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: client.color }} />
      {client.name}
    </span>
  )
}
