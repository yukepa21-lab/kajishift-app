"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/lib/store"
import { CATEGORIES, FREQUENCIES, type Task, type TaskCategory, type TaskFrequency } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
}

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

export function TaskModal({ open, onOpenChange, task }: TaskModalProps) {
  const { addTask, updateTask, profiles } = useApp()
  const isEditing = !!task

  const defaultAssigneeId = profiles[0]?.id ?? ""

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<TaskCategory | "">("")
  const [durationMinutes, setDurationMinutes] = useState("")
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId)
  const [frequency, setFrequency] = useState<TaskFrequency | "">("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setCategory(task.category ?? "")
      setDurationMinutes(task.durationMinutes?.toString() ?? "")
      setAssigneeId(task.assigneeId)
      setFrequency(task.frequency ?? "")
    } else {
      setTitle("")
      setCategory("")
      setDurationMinutes("")
      setAssigneeId(defaultAssigneeId)
      setFrequency("")
    }
    setError("")
  }, [task, open, defaultAssigneeId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("タスク名を入力してください")
      return
    }

    setSaving(true)
    try {
      if (isEditing && task) {
        await updateTask(task.id, {
          title: title.trim(),
          category: category || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          assigneeId,
          frequency: frequency || undefined,
        })
      } else {
        await addTask({
          title: title.trim(),
          category: category || undefined,
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
          assigneeId,
          date: todayStr(),
          isCompleted: false,
          frequency: frequency || undefined,
        })
      }
      onOpenChange(false)
    } catch {
      setError("保存に失敗しました。もう一度お試しください。")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "タスクを編集" : "タスクを追加"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">タスク名 *</Label>
            <Input
              id="task-title"
              placeholder="例: 洗濯物をたたむ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-category">カテゴリ</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
              <SelectTrigger id="task-category">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-duration">所要時間（分）</Label>
            <Input
              id="task-duration"
              type="number"
              min={1}
              placeholder="例: 30"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-assignee">担当者</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger id="task-assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}（{p.role}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-frequency">頻度</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as TaskFrequency)}>
              <SelectTrigger id="task-frequency">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? "保存中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
