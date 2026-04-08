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
  const [newClientId, setNewClientId] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
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
    setNewClientId('')
    setSaving(false)
  }

  const getClient = (clientId: string) => clients.find(c => c.id === clientId)

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
              <p className="text-xs text-gray-400 mt-0.5">Cualquiera puede crear y eliminar proyectos</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Sin proyectos aún. ¡Crea el primero!</p>
            )}
            {projects.map(project => {
              const client = getClient(project.client_id)
              return (
                <div key={project.id}
                  className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors">
                  <div className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: client?.color || '#888780' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800">{project.name}</div>
                    {client && (
                      <div className="text-xs text-gray-400 mt-0.5">{client.name}</div>
                    )}
                  </div>
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
                      className="text-gray-300 hover:text-red-400 transition-colors p-1">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
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
              autoFocus
            />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Cliente asociado (opcional)</label>
              <select
                value={newClientId}
                onChange={e => setNewClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="">Sin cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
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
