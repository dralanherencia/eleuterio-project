interface Props {
  value: number
  color?: string
  showLabel?: boolean
  height?: number
}

export function ProgressBar({ value, color = '#378ADD', showLabel = false, height = 6 }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden bg-gray-100" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>}
    </div>
  )
}
