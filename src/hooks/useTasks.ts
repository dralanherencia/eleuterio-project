import { useState, useEffect, useCallback } from 'react'
import type { Task, Status, Client, Project } from '../types'
import { INITIAL_TASKS, CLIENTS, PROJECTS } from '../data/mockData'
import { supabase } from '../lib/supabase'

const USE_SUPABASE = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [clients] = useState<Client[]>(CLIENTS)
  const [projects] = useState<Project[]>(PROJECTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (USE_SUPABASE) fetchFromSupabase()
  }, [])

  const fetchFromSupabase = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('tasks').select('*').order('position')
    if (!error && data) setTasks(data)
    setLoading(false)
  }

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    if (USE_SUPABASE) {
      await supabase.from('tasks').update(updates).eq('id', id)
    }
  }, [])

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    const newTask: Task = { ...task, id: `t${Date.now()}` }
    setTasks(prev => [...prev, newTask])
    if (USE_SUPABASE) {
      const { data } = await supabase.from('tasks').insert(task).select().single()
      if (data) setTasks(prev => prev.map(t => t.id === newTask.id ? data : t))
    }
    return newTask
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (USE_SUPABASE) {
      await supabase.from('tasks').delete().eq('id', id)
    }
  }, [])

  const moveTask = useCallback(async (taskId: string, newStatus: Status, newPosition: number) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t)
      return updated
    })
    if (USE_SUPABASE) {
      await supabase.from('tasks').update({ status: newStatus, position: newPosition }).eq('id', taskId)
    }
  }, [])

  return { tasks, clients, projects, loading, updateTask, createTask, deleteTask, moveTask }
}
