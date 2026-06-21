interface AvatarProps {
  name?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'avatar--sm',
  md: 'avatar--md',
  lg: 'avatar--lg',
}

const colors = [
  'avatar-clr--blue',
  'avatar-clr--purple',
  'avatar-clr--green',
  'avatar-clr--amber',
  'avatar-clr--rose',
  'avatar-clr--cyan',
  'avatar-clr--indigo',
  'avatar-clr--pink',
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

export function Avatar({ name, size = 'md' }: AvatarProps) {
  if (!name) {
    return (
      <div className={`avatar avatar--empty ${sizeMap[size]}`}>
        <span className="avatar--empty-icon">?</span>
      </div>
    )
  }

  const colorClass = getColor(name)
  return (
    <div className={`avatar ${sizeMap[size]} ${colorClass}`}>
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
