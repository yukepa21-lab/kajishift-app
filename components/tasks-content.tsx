"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/lib/store"
import type { Task } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { TaskModal } from "@/components/task-modal"
import { Plus, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Filter = "all" | "husband" | "wife" | "completed"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "husband", label: "夫" },
  { value: "wife", label: "妻" },
  { value: "completed", label: "完了済" },
]

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export function TasksContent() {
  const { tasks, toggleTask, deleteTask, profiles } = useApp()
  const [filter, setFilter] = useState<Filter>("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const husband = profiles.find((p) => p.role === "夫")
  const wife = profiles.find((p) => p.role === "妻")

  const todayTasks = useMemo(() => {
    const today = todayStr()
    return tasks.filter((t) => t.date === today)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "husband":
        return husband ? todayTasks.filter((t) => t.assigneeId === husband.id) : []
      case "wife":
        return wife ? todayTasks.filter((t) => t.assigneeId === wife.id) : []
      case "completed":
        return todayTasks.filter((t) => t.isCompleted)
      default:
        return todayTasks
    }
  }, [todayTasks, filter, husband, wife])

  function getAssigneeName(assigneeId: string) {
    return profiles.find((p) => p.id === assigneeId)?.name ?? "不明"
  }

  function getAssigneeRole(assigneeId: string) {
    return profiles.find((p) => p.id === assigneeId)?.role ?? "不明"
  }

  function handleTaskClick(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleAddNew() {
    setEditingTask(null)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id)
    } catch {
      // handle error silently
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">タスク一覧</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            今日のタスクを管理できます
          </p>
        </div>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          追加
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {f.label}
            {f.value === "all" && (
              <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">
                {todayTasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "completed" ? "完了済のタスクはありません" : "タスクがありません"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleAddNew}>
              <Plus className="mr-1.5 h-4 w-4" />
              タスクを追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTasks.map((task) => {
            const assigneeRole = getAssigneeRole(task.assigneeId)
            return (
              <Card key={task.id} className="group overflow-hidden">
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => toggleTask(task.id)}
                    aria-label={`${task.title}を${task.isCompleted ? "未完了" : "完了"}にする`}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTaskClick(task)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTaskClick(task) } }}
                    className="flex flex-1 items-center gap-3 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          task.isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {task.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {task.category}
                          </Badge>
                        )}
                        {task.durationMinutes && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {task.durationMinutes}{"分"}
                          </span>
                        )}
                        {task.frequency && (
                          <span className="text-[10px] text-muted-foreground">
                            {task.frequency}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] font-normal",
                        assigneeRole === "夫"
                          ? "border-chart-1/30 text-chart-1"
                          : "border-chart-2/30 text-chart-2"
                      )}
                    >
                      {getAssigneeName(task.assigneeId)}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                    aria-label="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
      />
    </div>
  )
}
