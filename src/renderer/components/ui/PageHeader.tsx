import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="page-header__breadcrumbs">
          {breadcrumbs.map((bc, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {bc.href ? (
                <a href={bc.href} className="page-header__breadcrumb-link">{bc.label}</a>
              ) : (
                <span className="page-header__breadcrumb-current">{bc.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header__title">{title}</h1>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-3">{action}</div>}
      </div>
    </div>
  )
}
