import { useState } from 'react'
import type { Client } from '../../types'

const PRESET_COLORS = [
  '#378ADD', '#1D9E75', '#7F77DD', '#D85A30', '#888780',
  '#E24B4A', '#EF9F27', '#D4537E', '#0F6E56', '#534AB7',
  '#854F0B', '#185FA5', '#639922', '#993556', '#5F5E5A',
]

interface Props {
  clients: Client[]
  onCreateClient: (c: Omit<Client, 'id'>) => Promise<Client | null>
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<void>
  onDeleteClient: (id: string) => Promise<void>
  onClose: () => void
}

export function ClientManager({ clients, onCreateClient, onUpdateClient, onDeleteClient, onClose }: Props) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#378ADD')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    await onCreateClient({ name: newName.trim(), color: newColor })
    setNewName('')
    setNewColor('#378ADD')
    setSaving(false)
  }

  const handleEdit = (client: Client) => {
    setEditingId(client.id)
    setEditName(client.name)
    setEditColor(client.color)
  }

  const handleSaveEdit = async (id: string) => {
    await onUpdateClient(id, { name: editName.trim(), color: editColor })
    setEditingId(null)
  }

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
              <h2 className="text-base font-semibold text-gray-900">Gestionar clientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Agrega, edita o elimina tus clientes</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Client list */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {clients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay clientes aún. ¡Crea el primero!</p>
            )}
            {clients.map(client => (
              <div key={client.id} className="border border-gray-100 rounded-xl p-3">
                {editingId === client.id ? (
                  <div className="space-y-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map(c => (
                        <button key={c} onClick={() => setEditColor(c)}
                          className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                          style={{ backgroundColor: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEdit(client.id)}
                        className="flex-1 bg-blue-500 text-white text-xs py-1.5 rounded-lg hover:bg-blue-600 transition-colors">
                        Guardar
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: client.color }} />
                    <span className="flex-1 text-sm font-medium text-gray-800">{client.name}</span>
                    <button onClick={() => handleEdit(client)}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors px-2 py-1">
                      Editar
                    </button>
                    {confirmDelete === client.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-400">¿Eliminar?</span>
                        <button onClick={() => { onDeleteClient(client.id); setConfirmDelete(null) }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600">Sí</button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-400 px-1">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(client.id)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors px-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create new */}
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            <p className="text-xs font-medium text-gray-500">Nuevo cliente</p>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre del cliente"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: newColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
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
                  Agregar cliente
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
