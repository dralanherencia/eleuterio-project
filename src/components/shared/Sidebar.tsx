import { NavLink } from 'react-router-dom'

const links = [
  {
    to: '/', label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    to: '/kanban', label: 'Kanban',
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
        <path d="M3 6h18M3 12h12M3 18h8"/><circle cx="19" cy="12" r="2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="18" r="2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
]

export function Sidebar() {
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

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-xs">AH</span>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Dr. Alan Herencia</div>
            <div className="text-xs text-gray-400">Méd. Ocupacional</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
