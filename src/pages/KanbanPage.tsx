import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { TableView } from '../components/kanban/TableView'
import { ClientManager } from '../components/shared/ClientManager'
import { ProjectManager } from '../components/shared/ProjectManager'
import type { Status } from '../types'
import { KanbanSkeleton, ErrorState } from '../components/shared/LoadingStates'

// Client names that are "personas" (not enterprise clients) — excluded from client pills
const RESPONSABLE_CLIENT_NAMES = ['Alan', 'Mercedes', 'Alan y Mercedes', 'Personal']

type ViewMode = 'kanban' | 'table'

function getUserAssignee(email?: string): 'alan' | 'mercedes' {
  if (email === 'maria.vergara@upch.pe') return 'mercedes'
  return 'alan'
}

function getUserLabel(assignee: 'alan' | 'mercedes'): string {
  return assignee === 'alan' ? 'Dr. Alan' : 'Dra. Mercedes'
}

export function KanbanPage() {
  const { user } = useAuth()
  const {
    tasks, clients, projects, loading, error, refetch,
    updateTask, createTask, deleteTask, moveTask,
    createClient, updateClient, deleteClient, createProject, updateProject, deleteProject,
  } = useTasks()

  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showClientManager, setShowClientManager] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)

  if (loading) return <KanbanSkeleton />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  // --- VISTA POR USUARIO: filtro base (no seleccionable) ---
  const userAssignee = getUserAssignee(user?.email)
  const userTasks = tasks.filter(t => t.assignee === userAssignee || t.assignee === 'both')

  // --- PROYECTOS visibles para este usuario ---
  const userProjects = projects.filter(p => userTasks.some(t => t.project_id === p.id))

  // --- JERARQUÍA: Proyecto → Cliente ---
  const projectTasks = selectedProject === 'all'
    ? userTasks
    : userTasks.filter(t => t.project_id === selectedProject)

  const filteredTasks = selectedClient === 'all'
    ? projectTasks
    : projectTasks.filter(t => t.client_id === selectedClient)

  // Clientes-empresa con tareas visibles en el contexto de proyecto actual
  const visibleClients = clients.filter(c =>
    !RESPONSABLE_CLIENT_NAMES.includes(c.name) &&
    projectTasks.some(t => t.client_id === c.id)
  )

  const handleProjectChange = (id: string) => {
    setSelectedProject(id)
    setSelectedClient('all')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getUserLabel(userAssignee)}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
            {selectedProject !== 'all' && (
              <span className="text-gray-300"> · {projects.find(p => p.id === selectedProject)?.name}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="5" height="18" rx="1.5"/><rect x="10" y="3" width="5" height="12" rx="1.5"/>
                <rect x="17" y="3" width="5" height="15" rx="1.5"/>
              </svg>
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
              </svg>
              Tabla
            </button>
          </div>

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

      {/* Project tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button
          onClick={() => handleProjectChange('all')}
          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all border ${
            selectedProject === 'all'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          }`}
        >
          Todas ({userTasks.length})
        </button>
        {userProjects.map(p => {
          const pc = clients.find(cl => cl.id === p.client_id)
          const count = userTasks.filter(t => t.project_id === p.id).length
          const color = pc?.color || p.color || '#888780'
          const isActive = selectedProject === p.id
          return (
            <button
              key={p.id}
              onClick={() => handleProjectChange(p.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all border flex items-center gap-1.5 ${
                isActive ? 'border-transparent text-white' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={isActive ? { backgroundColor: color } : { color }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : color }} />
              {p.name} ({count})
            </button>
          )
        })}
        {userProjects.length === 0 && (
          <button onClick={() => setShowProjectManager(true)} className="text-xs text-blue-500 hover:underline px-1">
            + Crear proyecto
          </button>
        )}
      </div>

      {/* Client pills — only shown when there are multiple clients in scope */}
      {visibleClients.length > 1 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedClient('all')}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all border ${
              selectedClient === 'all'
                ? 'bg-gray-700 text-white border-gray-700'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}
          >
            Todos
          </button>
          {visibleClients.map(c => {
            const isActive = selectedClient === c.id
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClient(isActive ? 'all' : c.id)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all border flex items-center gap-1.5 ${
                  isActive ? 'border-transparent text-white' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                style={isActive ? { backgroundColor: c.color } : { color: c.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : c.color }} />
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      {/* View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          clients={clients}
          projects={projects}
          defaultAssignee={userAssignee}
          onMoveTask={(id, status, position) => moveTask(id, status as Status, position)}
          onUpdateTask={updateTask}
          onCreateTask={createTask}
          onDeleteTask={deleteTask}
        />
      ) : (
        <TableView
          tasks={filteredTasks}
          clients={clients}
          projects={projects}
          defaultAssignee={userAssignee}
          onUpdateTask={updateTask}
          onCreateTask={createTask}
          onDeleteTask={deleteTask}
        />
      )}

      {showProjectManager && (
        <ProjectManager projects={projects} clients={clients}
          onCreateProject={createProject} onUpdateProject={updateProject} onDeleteProject={deleteProject}
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
