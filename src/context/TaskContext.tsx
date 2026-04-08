import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Task, Status, Client, Project } from '../types'
import { supabase } from '../lib/supabase'

interface TaskContextType {
  tasks: Task[]
  clients: Client[]
  projects: Project[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  createTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<void>
  moveTask: (taskId: string, newStatus: Status, newPosition: number) => Promise<void>
  createClient: (client: Omit<Client, 'id'>) => Promise<Client | null>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  createProject: (project: Omit<Project, 'id'>) => Promise<Project | null>
  deleteProject: (id: string) => Promise<void>
}

const TaskContext = createContext<TaskContextType | null>(null)

const CACHE_KEY = 'eleuterio_cache'

function loadCache(): { tasks: Task[]; clients: Client[]; projects: Project[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(data: { tasks: Task[]; clients: Client[]; projects: Project[] }) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const cached = loadCache()
  const [tasks, setTasks] = useState<Task[]>(cached?.tasks || [])
  const [clients, setClients] = useState<Client[]>(cached?.clients || [])
  const [projects, setProjects] = useState<Project[]>(cached?.projects || [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    if (!loading) setLoading(false)
    try {
      const [t, c, p] = await Promise.all([
        supabase.from('tasks').select('*').order('position'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
      ])
      if (t.error || c.error || p.error) throw new Error('Error cargando datos')
      const data = {
        tasks: t.data || [],
        clients: c.data || [],
        projects: p.data || [],
      }
      setTasks(data.tasks)
      setClients(data.clients)
      setProjects(data.projects)
      saveCache(data)
    } catch (e) {
      setError('No se pudo conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // TASKS
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    const { data } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
    if (data) {
      setTasks(prev => {
        const updated = prev.map(t => t.id === id ? data : t)
        saveCache({ tasks: updated, clients, projects })
        return updated
      })
    }
  }, [clients, projects])

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    const { data } = await supabase.from('tasks').insert(task).select().single()
    if (data) {
      setTasks(prev => {
        const updated = [...prev, data]
        saveCache({ tasks: updated, clients, projects })
        return updated
      })
    }
    return data
  }, [clients, projects])

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id)
      saveCache({ tasks: updated, clients, projects })
      return updated
    })
    await supabase.from('tasks').delete().eq('id', id)
  }, [clients, projects])

  const moveTask = useCallback(async (taskId: string, newStatus: Status, newPosition: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t)
      saveCache({ tasks: updated, clients, projects })
      return updated
    })
    await supabase.from('tasks').update({ status: newStatus, position: newPosition }).eq('id', taskId)
  }, [clients, projects])

  // CLIENTS
  const createClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const { data } = await supabase.from('clients').insert(client).select().single()
    if (data) {
      setClients(prev => {
        const updated = [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
        saveCache({ tasks, clients: updated, projects })
        return updated
      })
    }
    return data
  }, [tasks, projects])

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    setClients(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      saveCache({ tasks, clients: updated, projects })
      return updated
    })
    await supabase.from('clients').update(updates).eq('id', id)
  }, [tasks, projects])

  const deleteClient = useCallback(async (id: string) => {
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveCache({ tasks, clients: updated, projects })
      return updated
    })
    await supabase.from('clients').delete().eq('id', id)
  }, [tasks, projects])

  // PROJECTS
  const createProject = useCallback(async (project: Omit<Project, 'id'>) => {
    const { data } = await supabase.from('projects').insert(project).select().single()
    if (data) {
      setProjects(prev => {
        const updated = [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
        saveCache({ tasks, clients, projects: updated })
        return updated
      })
    }
    return data
  }, [tasks, clients])

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id)
      saveCache({ tasks, clients, projects: updated })
      return updated
    })
    await supabase.from('projects').delete().eq('id', id)
  }, [tasks, clients])

  return (
    <TaskContext.Provider value={{
      tasks, clients, projects, loading, error, refetch: fetchAll,
      updateTask, createTask, deleteTask, moveTask,
      createClient, updateClient, deleteClient,
      createProject, deleteProject,
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be used within TaskProvider')
  return ctx
}
