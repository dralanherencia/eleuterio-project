import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { StreakBadge } from '../../Celebration'

const links = [
  {
    to: '/', label: 'Tareas',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/>
        <rect x="17" y="3" width="5" height="15" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/gantt', label: 'Gantt',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 6h18M3 12h12M3 18h8"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const { user, signOut } = useAuth()

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  const displayName = user?.email === 'jeanpihero2@gmail.com'
    ? 'Dr. Alan Herencia'
    : user?.email === 'maria.vergara@upch.pe'
    ? 'Dra. Mercedes Vergara'
    : user?.email?.split('@')[0] || 'Usuario'

  const role = 'Méd. Ocupacional'

  const avatarColor = user?.email === 'maria.vergara@upch.pe'
    ? { bg: '#F3E8FF', text: '#7F77DD' }
    : { bg: '#DBEAFE', text: '#1D4ED8' }

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900 leading-tight">Eleuterio</div>
            <div className="text-xs text-gray-400">Project Manager</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Streak badge */}
      <div className="px-3 mb-2">
        <StreakBadge />
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: avatarColor.bg }}>
            <span className="font-semibold text-xs" style={{ color: avatarColor.text }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-700 truncate">{displayName}</div>
            <div className="text-xs text-gray-400">{role}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
