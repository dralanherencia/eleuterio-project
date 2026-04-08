import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { KanbanBoard } from '../components/kanban/KanbanBoard'
import { ClientManager } from '../components/shared/ClientManager'
import { ProjectManager } from '../components/shared/ProjectManager'
import type { Status } from '../types'

export function KanbanPage() {
  const {
    tasks, clients, projects, updateTask, createTask, deleteTask, moveTask,
    createClient, updateClient, deleteClient,
    createProject, deleteProject,
  } = useTasks()

  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showClientManager, setShowClientManager] = useState(false)
  const [showProjectManager, setShowProjectManager] = useState(false)

  const toggleClient = (id: string) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const filteredByProject = selectedProject
    ? tasks.filter(t => t.project_id === selectedProject)
    : tasks

  const clientsInView = selectedProject
    ? [...new Set(filteredByProject.map(t => t.client_id))]
        .map(id => clients.find(c => c.id === id)).filter(Boolean) as typeof clients
    : clients

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kanban</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestión de tareas por estado</p>
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

      {/* Project filter */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Proyecto:</span>
        <button onClick={() => { setSelectedProject(''); setSelectedClients([]) }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!selectedProject ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
          Todos
        </button>
        {projects.map(p => {
          const client = clients.find(c => c.id === p.client_id)
          const isSelected = selectedProject === p.id
          return (
            <button key={p.id}
              onClick={() => { setSelectedProject(isSelected ? '' : p.id); setSelectedClients([]) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${isSelected ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              style={isSelected ? { backgroundColor: client?.color || '#888' } : { color: client?.color || '#888' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isSelected ? 'white' : (client?.color || '#888') }} />
              {p.name}
            </button>
          )
        })}
        {projects.length === 0 && (
          <button onClick={() => setShowProjectManager(true)}
            className="text-xs text-blue-500 hover:underline">
            + Crear primer proyecto
          </button>
        )}
      </div>

      {/* Client filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Cliente:</span>
        <button onClick={() => setSelectedClients([])}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedClients.length === 0 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
          Todos
        </button>
        {clientsInView.map(c => (
          <button key={c.id} onClick={() => toggleClient(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${selectedClients.includes(c.id) ? 'text-white border-transparent' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            style={selectedClients.includes(c.id) ? { backgroundColor: c.color, borderColor: c.color } : { color: c.color }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedClients.includes(c.id) ? 'white' : c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      <KanbanBoard
        tasks={filteredByProject}
        clients={clients}
        projects={projects}
        selectedClients={selectedClients}
        onMoveTask={(id, status, position) => moveTask(id, status as Status, position)}
        onUpdateTask={updateTask}
        onCreateTask={createTask}
        onDeleteTask={deleteTask}
      />

      {showProjectManager && (
        <ProjectManager
          projects={projects}
          clients={clients}
          onCreateProject={createProject}
          onDeleteProject={deleteProject}
          onClose={() => setShowProjectManager(false)}
        />
      )}

      {showClientManager && (
        <ClientManager
          clients={clients}
          onCreateClient={createClient}
          onUpdateClient={updateClient}
          onDeleteClient={deleteClient}
          onClose={() => setShowClientManager(false)}
        />
      )}
    </div>
  )
}
