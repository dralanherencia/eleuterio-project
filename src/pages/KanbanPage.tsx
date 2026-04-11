import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { ClientManager } from '../components/shared/ClientManager'
import { ProjectManager } from '../components/shared/ProjectManager'
import type { Status, Assignee } from '../types'
import { KanbanSkeleton, ErrorState } from '../components/shared/LoadingStates'
import { ASSIGNEE_LABELS, ASSIGNEE_COLORS } from '../types'

const ASSIGNEES: Assignee[] = ['alan', 'mercedes', 'both']

// Nombres de clients que son "responsables" (personas), no clientes-empresa
const RESPONSABLE_CLIENT_NAMES = ['Alan', 'Mercedes', 'Alan y Mercedes', 'Personal']

export function KanbanPage() {
  const {
    tasks, clients, projects, loading, error, refetch,
    updateTask, createTask, deleteTask, moveTask,
    createClient, updateClient, deleteClient, createProject, deleteProject,
  } = useTasks()

  if (loading) return <KanbanSkeleton />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedAssignee, setSelectedAssignee] = useState<Assignee | 'all'>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [showClientManager, setShowClientManager] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)

  // --- JERARQUÍA: Proyecto > Responsable (estricto) > Cliente ---

  // 1. Filtrar por proyecto
  const projectTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter(t => t.project_id === selectedProject)

  // 2. Filtrar por responsable — ESTRICTO: NO incluye "both" al filtrar por alan o mercedes
  const respTasks = selectedAssignee === 'all'
    ? projectTasks
    : projectTasks.filter(t => t.assignee === selectedAssignee)

  // 3. Filtrar por cliente (client_id que NO es persona/responsable)
  const filteredTasks = selectedClient === 'all'
    ? respTasks
    : respTasks.filter(t => t.client_id === selectedClient)

  // Clientes-empresa dinámicos: solo los que tienen tareas visibles en el contexto actual
  const clientesEmpresa = clients.filter(c => !RESPONSABLE_CLIENT_NAMES.includes(c.name))
  const usedClientIds = new Set(respTasks.map(t => t.client_id).filter(Boolean))
  const visibleClientes = clientesEmpresa.filter(c => usedClientIds.has(c.id))

  // Reset client filter cuando cambia proyecto o responsable
  const handleProjectChange = (id: string) => {
    setSelectedProject(id === selectedProject ? 'all' : id)
    setSelectedAssignee('all')
    setSelectedClient('all')
  }

  const handleAssigneeChange = (a: Assignee | 'all') => {
    setSelectedAssignee(a === selectedAssignee ? 'all' : a)
    setSelectedClient('all')
  }

  const handleClientChange = (id: string) => {
    setSelectedClient(id === selectedClient ? 'all' : id)
  }

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
            {selectedProject !== 'all' && (
              <span className="text-gray-300"> · {projects.find(p => p.id === selectedProject)?.name}</span>
            )}
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

      {/* Filters — JERÁRQUICOS: Proyecto > Responsable > Cliente */}
      <div className="space-y-2 mb-5 bg-gray-50 rounded-2xl p-4">

        {/* 1. Proyecto (nivel superior) */}
        <FilterRow label="Proyecto:">
          <Chip label="Todos" active={selectedProject === 'all'} onClick={() => handleProjectChange('all')} />
          {projects.map(p => {
            const c = clients.find(cl => cl.id === p.client_id)
            const count = tasks.filter(t => t.project_id === p.id).length
            return (
              <Chip key={p.id}
                label={`${p.name} (${count})`}
                active={selectedProject === p.id}
                color={c?.color || p.color || '#888780'}
                onClick={() => handleProjectChange(p.id)} />
            )
          })}
          {projects.length === 0 && (
            <button onClick={() => setShowProjectManager(true)} className="text-xs text-blue-500 hover:underline">
              + Crear proyecto
            </button>
          )}
        </FilterRow>

        {/* 2. Responsable (estricto — NO incluye "Ambos" al filtrar) */}
        <FilterRow label="Responsable:">
          <Chip label="Todos" active={selectedAssignee === 'all'} onClick={() => handleAssigneeChange('all')} />
          {ASSIGNEES.map(a => {
            const ac = ASSIGNEE_COLORS[a]
            const count = projectTasks.filter(t => t.assignee === a).length
            return (
              <button key={a}
                onClick={() => handleAssigneeChange(a)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${selectedAssignee === a ? 'border-transparent text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                style={selectedAssignee === a
                  ? { backgroundColor: ac.text }
                  : { color: ac.text, backgroundColor: ac.bg }}>
                {ASSIGNEE_LABELS[a]} ({count})
              </button>
            )
          })}
        </FilterRow>

        {/* 3. Cliente (dinámico — solo muestra clientes-empresa con tareas visibles) */}
        {visibleClientes.length > 0 && (
          <FilterRow label="Cliente:">
            <Chip label="Todos" active={selectedClient === 'all'} onClick={() => handleClientChange('all')} />
            {visibleClientes.map(c => (
              <Chip key={c.id} label={c.name} active={selectedClient === c.id}
                color={c.color}
                onClick={() => handleClientChange(c.id)} />
            ))}
          </FilterRow>
        )}

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
