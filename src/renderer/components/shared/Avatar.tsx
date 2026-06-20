interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizeMap = {
  sm: 'avatar--sm',
  md: 'avatar--md',
  lg: 'avatar--lg',
}

const colors = [
  'bg-blue-200 text-blue-700',
  'bg-purple-200 text-purple-700',
  'bg-emerald-200 text-emerald-700',
  'bg-amber-200 text-amber-700',
  'bg-rose-200 text-rose-700',
  'bg-cyan-200 text-cyan-700',
  'bg-indigo-200 text-indigo-700',
  'bg-pink-200 text-pink-700',
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Avatar({ name, size = 'md', color }: AvatarProps) {
  if (!name) {
    return (
      <div className={`avatar avatar--empty ${sizeMap[size]}`}>
        <span className="avatar--empty-icon">?</span>
      </div>
    )
  }

  const colorClass = color || getColor(name)
  return (
    <div className={`avatar ${sizeMap[size]} font-semibold ${colorClass}`}>
      {getInitials(name)}
    </div>
  )
}

interface AvatarStackProps {
  names: string[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarStack({ names, max = 4, size = 'sm' }: AvatarStackProps) {
  const visible = names.slice(0, max)
  const remaining = names.length - max

  return (
    <div className="avatar-stack">
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} />
      ))}
      {remaining > 0 && (
        <div className={`avatar-stack__overflow ${sizeMap[size]}`}>
          +{remaining}
        </div>
      )}
    </div>
  )
}
