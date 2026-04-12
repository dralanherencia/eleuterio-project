import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
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
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
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

  // Mutation sequence counter: prevents a slow in-flight fetchAll from
  // overwriting optimistic updates or post-mutation fetches
  const mutSeq = useRef(0)

  const fetchAll = useCallback(async () => {
    setError(null)
    const seq = mutSeq.current
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
      // Only apply if no mutations started since this fetch began
      if (mutSeq.current === seq) {
        setTasks(data.tasks)
        setClients(data.clients)
        setProjects(data.projects)
        saveCache(data)
      }
    } catch {
      setError('No se pudo conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── TASKS ────────────────────────────────────────────────────────────────

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    mutSeq.current++
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await supabase.from('tasks').update(updates).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    mutSeq.current++
    const { data } = await supabase.from('tasks').insert(task).select().single()
    if (data) setTasks(prev => [...prev, data])
    await fetchAll()
    return data
  }, [fetchAll])

  const deleteTask = useCallback(async (id: string) => {
    mutSeq.current++
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const moveTask = useCallback(async (taskId: string, newStatus: Status, newPosition: number) => {
    mutSeq.current++
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t))
    await supabase.from('tasks').update({ status: newStatus, position: newPosition }).eq('id', taskId)
    await fetchAll()
  }, [fetchAll])

  // ─── CLIENTS ──────────────────────────────────────────────────────────────

  const createClient = useCallback(async (client: Omit<Client, 'id'>) => {
    mutSeq.current++
    const { data } = await supabase.from('clients').insert(client).select().single()
    if (data) setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    await fetchAll()
    return data
  }, [fetchAll])

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    mutSeq.current++
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    await supabase.from('clients').update(updates).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteClient = useCallback(async (id: string) => {
    mutSeq.current++
    setClients(prev => prev.filter(c => c.id !== id))
    setTasks(prev => prev.map(t => t.client_id === id ? { ...t, client_id: null } : t))
    setProjects(prev => prev.map(p => p.client_id === id ? { ...p, client_id: null } : p))
    // Nullify FK references in tasks AND projects, then delete client
    await supabase.from('tasks').update({ client_id: null }).eq('client_id', id)
    await supabase.from('projects').update({ client_id: null }).eq('client_id', id)
    await supabase.from('clients').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  // ─── PROJECTS ─────────────────────────────────────────────────────────────

  const createProject = useCallback(async (project: Omit<Project, 'id'>) => {
    mutSeq.current++
    const { data } = await supabase.from('projects').insert(project).select().single()
    if (data) setProjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    await fetchAll()
    return data
  }, [fetchAll])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    mutSeq.current++
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    await supabase.from('projects').update(updates).eq('id', id)
    await fetchAll()
  }, [fetchAll])

  const deleteProject = useCallback(async (id: string) => {
    mutSeq.current++
    // Optimistic: remove project + nullify task project_ids
    setProjects(prev => prev.filter(p => p.id !== id))
    setTasks(prev => prev.map(t => t.project_id === id ? { ...t, project_id: null } : t))
    // Server: first nullify tasks, then delete project
    await supabase.from('tasks').update({ project_id: null }).eq('project_id', id)
    await supabase.from('projects').delete().eq('id', id)
    await fetchAll()
  }, [fetchAll])

  return (
    <TaskContext.Provider value={{
      tasks, clients, projects, loading, error, refetch: fetchAll,
      updateTask, createTask, deleteTask, moveTask,
      createClient, updateClient, deleteClient,
      createProject, updateProject, deleteProject,
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
