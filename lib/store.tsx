"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import {
  type Profile,
  type Shift,
  type Task,
  type ShiftType,
  type TaskCategory,
  type TaskFrequency,
} from "./types"

// Re-export types for convenience
export type { Profile, Shift, Task, ShiftType, TaskCategory, TaskFrequency }

const supabase = createClient()

// ─── SWR fetchers ────────────────────────────────────────────
async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    userId: p.user_id,
    name: p.name,
    role: p.role,
  }))
}

async function fetchShifts(): Promise<Shift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("date", { ascending: true })
  if (error) throw error
  return (data ?? []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    date: s.date,
    shiftType: s.shift_type as ShiftType,
  }))
}

async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []).map((t) => ({
    id: t.id,
    assigneeId: t.assignee_id,
    title: t.title,
    category: t.category as TaskCategory | undefined,
    durationMinutes: t.duration_minutes ?? undefined,
    date: t.date,
    isCompleted: t.is_completed,
    frequency: t.frequency as TaskFrequency | undefined,
  }))
}

// ─── Context ─────────────────────────────────────────────────
interface AppState {
  user: User | null
  currentProfile: Profile | null
  profiles: Profile[]
  shifts: Shift[]
  tasks: Task[]
  isLoading: boolean
  logout: () => Promise<void>
  upsertShift: (userId: string, date: string, shiftType: ShiftType) => Promise<void>
  getShift: (userId: string, date: string) => Shift | undefined
  addTask: (task: Omit<Task, "id">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  getTasksForDate: (date: string) => Task[]
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const { data: profiles = [], isLoading: profilesLoading } = useSWR(
    authReady && user ? "profiles" : null,
    fetchProfiles
  )

  const { data: shifts = [], isLoading: shiftsLoading } = useSWR(
    authReady && user ? "shifts" : null,
    fetchShifts
  )

  const { data: tasks = [], isLoading: tasksLoading } = useSWR(
    authReady && user ? "tasks" : null,
    fetchTasks
  )

  const currentProfile = profiles.find((p) => p.userId === user?.id) ?? null
  const isLoading = !authReady || profilesLoading || shiftsLoading || tasksLoading

  // ─── Auth ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/login"
  }, [])

  // ─── Shifts ──────────────────────────────────────────────
  const upsertShift = useCallback(
    async (userId: string, date: string, shiftType: ShiftType) => {
      const { error } = await supabase.from("shifts").upsert(
        { user_id: userId, date, shift_type: shiftType },
        { onConflict: "user_id,date" }
      )
      if (error) throw error
      await globalMutate("shifts")
    },
    []
  )

  const getShift = useCallback(
    (userId: string, date: string) => {
      return shifts.find((s) => s.userId === userId && s.date === date)
    },
    [shifts]
  )

  // ─── Tasks ───────────────────────────────────────────────
  const addTask = useCallback(async (task: Omit<Task, "id">) => {
    const { error } = await supabase.from("tasks").insert({
      assignee_id: task.assigneeId,
      title: task.title,
      category: task.category ?? null,
      duration_minutes: task.durationMinutes ?? null,
      date: task.date,
      is_completed: task.isCompleted,
      frequency: task.frequency ?? null,
    })
    if (error) throw error
    await globalMutate("tasks")
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes
    if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
    if (updates.date !== undefined) dbUpdates.date = updates.date

    const { error } = await supabase.from("tasks").update(dbUpdates).eq("id", id)
    if (error) throw error
    await globalMutate("tasks")
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
    await globalMutate("tasks")
  }, [])

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      await updateTask(id, { isCompleted: !task.isCompleted })
    },
    [tasks, updateTask]
  )

  const getTasksForDate = useCallback(
    (date: string) => {
      return tasks.filter((t) => t.date === date)
    },
    [tasks]
  )

  return (
    <AppContext.Provider
      value={{
        user,
        currentProfile,
        profiles,
        shifts,
        tasks,
        isLoading,
        logout,
        upsertShift,
        getShift,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        getTasksForDate,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
