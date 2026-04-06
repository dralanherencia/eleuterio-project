import { useState, useEffect, useCallback } from 'react'
import type { Task, Status, Client, Project } from '../types'
import { supabase } from '../lib/supabase'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [t, c, p] = await Promise.all([
      supabase.from('tasks').select('*').order('position'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('*').order('name'),
    ])
    if (t.data) setTasks(t.data)
    if (c.data) setClients(c.data)
    if (p.data) setProjects(p.data)
    setLoading(false)
  }

  // --- TASKS ---
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    await supabase.from('tasks').update(updates).eq('id', id)
  }, [])

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    const { data } = await supabase.from('tasks').insert(task).select().single()
    if (data) setTasks(prev => [...prev, data])
    return data
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }, [])

  const moveTask = useCallback(async (taskId: string, newStatus: Status, newPosition: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t))
    await supabase.from('tasks').update({ status: newStatus, position: newPosition }).eq('id', taskId)
  }, [])

  // --- CLIENTS ---
  const createClient = useCallback(async (client: Omit<Client, 'id'>) => {
    const { data } = await supabase.from('clients').insert(client).select().single()
    if (data) setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }, [])

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    await supabase.from('clients').update(updates).eq('id', id)
  }, [])

  const deleteClient = useCallback(async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    await supabase.from('clients').delete().eq('id', id)
  }, [])

  // --- PROJECTS ---
  const createProject = useCallback(async (project: Omit<Project, 'id'>) => {
    const { data } = await supabase.from('projects').insert(project).select().single()
    if (data) setProjects(prev => [...prev, data])
    return data
  }, [])

  return {
    tasks, clients, projects, loading,
    updateTask, createTask, deleteTask, moveTask,
    createClient, updateClient, deleteClient,
    createProject,
    refetch: fetchAll,
  }
}
