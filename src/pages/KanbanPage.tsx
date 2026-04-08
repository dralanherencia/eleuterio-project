import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { ClientManager } from '../components/shared/ClientManager'
import { ProjectManager } from '../components/shared/ProjectManager'
import type { Status, Assignee } from '../types'
import { ASSIGNEE_LABELS, ASSIGNEE_COLORS } from '../types'

const ASSIGNEES: Assignee[] = ['alan', 'mercedes', 'both']

export function KanbanPage() {
  const {
    tasks, clients, projects, updateTask, createTask, deleteTask, moveTask,
    createClient, updateClient, deleteClient, createProject, deleteProject,
  } = useTasks()

  const [selectedAssignee, setSelectedAssignee] = useState<Assignee | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [showClientManager, setShowClientManager] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)

  // Three completely independent filters combined with AND
  const filteredTasks = tasks.filter(t => {
    const byAssignee = selectedAssignee === 'all' || t.assignee === selectedAssignee || t.assignee === 'both'
    const byProject = selectedProject === 'all' || t.project_id === selectedProject
    const byClient = selectedClient === 'all' || t.client_id === selectedClient
    return byAssignee && byProject && byClient
  })

  const FilterRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-medium w-24 flex-shrink-0">{label}</span>
      {children}
    </div>
  )

  const Chip = ({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) => (
    <button onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium flex items-center gap-1.5 ${active ? 'border-transparent text-white' : 'bg-white border-gray-200 hover:border-gray-300'}`}
      style={active
        ? { backgroundColor: color || '#1a1a2e' }
        : { color: color || '#6b7280' }
      }>
      {color && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? 'white' : color }} />}
      {label}
    </button>
  )

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kanban</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} visibles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowProjectManager(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-all">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            Proyectos
          </button>
          <button onClick={() => setShowClientManager(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-all">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Clientes
          </button>
        </div>
      </div>

      {/* Filters — all independent */}
      <div className="space-y-2 mb-5 bg-gray-50 rounded-2xl p-4">

        {/* Responsable */}
        <FilterRow label="Responsable:">
          <Chip label="Todos" active={selectedAssignee === 'all'} onClick={() => setSelectedAssignee('all')} />
          {ASSIGNEES.map(a => {
            const ac = ASSIGNEE_COLORS[a]
            return (
              <button key={a}
                onClick={() => setSelectedAssignee(selectedAssignee === a ? 'all' : a)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${selectedAssignee === a ? 'border-transparent text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                style={selectedAssignee === a
                  ? { backgroundColor: ac.text }
                  : { color: ac.text, backgroundColor: ac.bg }}>
                {ASSIGNEE_LABELS[a]}
              </button>
            )
          })}
        </FilterRow>

        {/* Proyecto */}
        <FilterRow label="Proyecto:">
          <Chip label="Todos" active={selectedProject === 'all'} onClick={() => setSelectedProject('all')} />
          {projects.map(p => {
            const c = clients.find(cl => cl.id === p.client_id)
            return (
              <Chip key={p.id} label={p.name} active={selectedProject === p.id}
                color={c?.color || '#888780'}
                onClick={() => setSelectedProject(selectedProject === p.id ? 'all' : p.id)} />
            )
          })}
          {projects.length === 0 && (
            <button onClick={() => setShowProjectManager(true)} className="text-xs text-blue-500 hover:underline">
              + Crear proyecto
            </button>
          )}
        </FilterRow>

        {/* Cliente */}
        <FilterRow label="Cliente:">
          <Chip label="Todos" active={selectedClient === 'all'} onClick={() => setSelectedClient('all')} />
          {clients.map(c => (
            <Chip key={c.id} label={c.name} active={selectedClient === c.id}
              color={c.color}
              onClick={() => setSelectedClient(selectedClient === c.id ? 'all' : c.id)} />
          ))}
        </FilterRow>

      </div>

      <KanbanBoard
        tasks={filteredTasks}
        clients={clients}
        projects={projects}
        selectedClients={[]}
        onMoveTask={(id, status, position) => moveTask(id, status as Status, position)}
        onUpdateTask={updateTask}
        onCreateTask={createTask}
        onDeleteTask={deleteTask}
      />

      {showProjectManager && (
        <ProjectManager projects={projects} clients={clients}
          onCreateProject={createProject} onDeleteProject={deleteProject}
          onClose={() => setShowProjectManager(false)} />
      )}
      {showClientManager && (
        <ClientManager clients={clients}
          onCreateClient={createClient} onUpdateClient={updateClient} onDeleteClient={deleteClient}
          onClose={() => setShowClientManager(false)} />
      )}
    </div>
  )
}
