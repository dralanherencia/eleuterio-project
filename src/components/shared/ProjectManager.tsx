import { useState } from 'react'
import type { Project, Client } from '../../types'

interface Props {
  projects: Project[]
  clients: Client[]
  onCreateProject: (p: Omit<Project, 'id'>) => Promise<Project | null>
  onDeleteProject: (id: string) => Promise<void>
  onClose: () => void
}

export function ProjectManager({ projects, clients, onCreateProject, onDeleteProject, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [newClientId, setNewClientId] = useState(clients[0]?.id || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim() || !newClientId) return
    setSaving(true)
    const client = clients.find(c => c.id === newClientId)
    await onCreateProject({
      name: newName.trim(),
      client_id: newClientId,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: client?.color || '#888780',
    })
    setNewName('')
    setSaving(false)
  }

  // Group projects by client
  const grouped = clients.map(c => ({
    client: c,
    projects: projects.filter(p => p.client_id === c.id),
  })).filter(g => g.projects.length > 0)

  const ungrouped = projects.filter(p => !clients.find(c => c.id === p.client_id))

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col"
          style={{ animation: 'fadeIn 0.18s ease' }}>
          <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Gestionar proyectos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Agrupa tus tareas por proyecto</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Project list grouped by client */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {projects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay proyectos. ¡Crea el primero!</p>
            )}

            {grouped.map(({ client, projects: cProjects }) => (
              <div key={client.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: client.color }} />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{client.name}</span>
                </div>
                <div className="space-y-1.5 pl-4">
                  {cProjects.map(project => (
                    <div key={project.id}
                      className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5">
                      <div className="w-1 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: client.color }} />
                      <span className="flex-1 text-sm font-medium text-gray-800">{project.name}</span>
                      {confirmDelete === project.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-red-400">¿Eliminar?</span>
                          <button onClick={() => { onDeleteProject(project.id); setConfirmDelete(null) }}
                            className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Sí</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-400 px-1">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(project.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {ungrouped.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sin cliente</div>
                {ungrouped.map(project => (
                  <div key={project.id} className="flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2.5 mb-1.5">
                    <span className="flex-1 text-sm font-medium text-gray-800">{project.name}</span>
                    <button onClick={() => onDeleteProject(project.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create new */}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <p className="text-xs font-medium text-gray-500">Nuevo proyecto</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre del proyecto"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
            />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Cliente</label>
              <select
                value={newClientId}
                onChange={e => setNewClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                {clients.length === 0 && <option value="">Primero crea un cliente</option>}
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim() || !newClientId}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {saving ? 'Guardando…' : (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Agregar proyecto
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
