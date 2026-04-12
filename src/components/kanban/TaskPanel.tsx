import { useEffect, useRef, useState } from 'react'
import type { Task, Status, Priority, Assignee, Client, Project } from '../../types'
import { STATUS_LABELS } from '../../types'
import { ClientChip } from '../shared/ClientChip'

interface Props {
  task: Task | null
  isNew?: boolean
  clients: Client[]
  projects: Project[]
  onSave: (task: Task) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function TaskPanel({ task, isNew, clients, projects, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setForm({ ...task })
      setConfirmDelete(false)
      setTimeout(() => titleRef.current?.focus(), 100)
    }
  }, [task])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!task || !form) return null

  const client = clients.find(c => c.id === form.client_id)
  const allProjects = projects

  const set = (field: keyof Task, value: string | number | null) =>
    setForm(prev => prev ? { ...prev, [field]: value } : prev)

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    onSave(form)
    setSaving(false)
  }

  const isOverdue = form.due_date && new Date(form.due_date) < new Date()

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{ animation: 'slideIn 0.22s ease' }}>

        <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {client && <ClientChip client={client} size="sm" />}
            <div className="text-xs text-gray-400 mt-1">{isNew ? 'Nueva tarea' : 'Editar tarea'}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5 flex-shrink-0">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Título</label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              placeholder="Nombre de la tarea"
            />
          </div>

          {/* Cliente y Proyecto */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cliente</label>
              <select
                value={form.client_id || ''}
                onChange={e => set('client_id', e.target.value || null)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="">Sin cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Proyecto</label>
              <select
                value={form.project_id || ''}
                onChange={e => set('project_id', e.target.value || null)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="">Sin proyecto</option>
                {allProjects.map(p => {
                  const pc = clients.find(c => c.id === p.client_id)
                  return <option key={p.id} value={p.id}>{p.name}{pc ? ` · ${pc.name}` : ''}</option>
                })}
              </select>
            </div>
          </div>

          {/* Estado y Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Estado</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as Status)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                Vencimiento {isOverdue && '· Vencida'}
              </label>
              <input
                type="date"
                value={form.due_date || ''}
                onChange={e => set('due_date', e.target.value || null)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-white ${
                  isOverdue ? 'border-red-300 text-red-600 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-50'
                }`}
              />
            </div>
          </div>


          {/* Prioridad y Responsable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Prioridad</label>
              <select
                value={form.priority || 'medium'}
                onChange={e => set('priority', e.target.value as Priority)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="high">↑ Alta</option>
                <option value="medium">— Media</option>
                <option value="low">↓ Baja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Responsable</label>
              <select
                value={form.assignee || 'alan'}
                onChange={e => set('assignee', e.target.value as Assignee)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-all bg-white"
              >
                <option value="alan">Alan</option>
                <option value="mercedes">Mercedes</option>
                <option value="both">Ambos</option>
              </select>
            </div>
          </div>

          {/* Próximo paso */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Próximo paso</label>
            <textarea
              value={form.next_step || ''}
              onChange={e => set('next_step', e.target.value || null)}
              rows={2}
              placeholder="¿Qué hay que hacer a continuación?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notas</label>
            <textarea
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={3}
              placeholder="Observaciones, referencias, pendientes…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none"
            />
          </div>

          {/* Link de archivo */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Link de archivo</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={form.file_url || ''}
                onChange={e => set('file_url', e.target.value || null)}
                placeholder="https://docs.google.com/..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              {form.file_url && (
                <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex-shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors"
                  onClick={e => e.stopPropagation()}>
                  Abrir
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Eliminar tarea
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">¿Confirmar?</span>
              <button onClick={() => { onDelete(form.id); onClose() }}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5">
                Cancelar
              </button>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Guardando…
              </>
            ) : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}
