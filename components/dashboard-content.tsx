"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useApp } from "@/lib/store"
import { SHIFT_TYPES } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Clock } from "lucide-react"

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  const days = ["日", "月", "火", "水", "木", "金", "土"]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`
}

export function DashboardContent() {
  const { user, currentProfile, getShift, getTasksForDate, toggleTask, profiles } = useApp()
  const today = todayStr()

  const todayShift = user ? getShift(user.id, today) : undefined
  const todayTasks = getTasksForDate(today)

  const shiftInfo = todayShift
    ? SHIFT_TYPES.find((s) => s.type === todayShift.shiftType)
    : null

  const husband = profiles.find((p) => p.role === "夫")
  const wife = profiles.find((p) => p.role === "妻")

  const husbandTasks = useMemo(
    () => (husband ? todayTasks.filter((t) => t.assigneeId === husband.id) : []),
    [todayTasks, husband]
  )
  const wifeTasks = useMemo(
    () => (wife ? todayTasks.filter((t) => t.assigneeId === wife.id) : []),
    [todayTasks, wife]
  )

  const husbandCompleted = husbandTasks.filter((t) => t.isCompleted).length
  const wifeCompleted = wifeTasks.filter((t) => t.isCompleted).length

  return (
    <div className="flex flex-col gap-6">
      {/* Date and greeting */}
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">
          {"おかえりなさい、"}{currentProfile?.name ?? "ユーザー"}{"さん"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{formatDate(today)}</p>
      </div>

      {/* Today's shift */}
      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
              {shiftInfo ? shiftInfo.icon : "?"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">今日のシフト</p>
              <p className="text-lg font-bold text-foreground">
                {shiftInfo ? shiftInfo.label : "未登録"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/shift">
              <Calendar className="mr-1.5 h-4 w-4" />
              {todayShift ? "変更する" : "登録する"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Task cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {husband && (
          <TaskGroupCard
            title={`${husband.name}の担当`}
            tasks={husbandTasks}
            completedCount={husbandCompleted}
            onToggle={toggleTask}
            accentClass="bg-chart-1/10 text-chart-1"
          />
        )}
        {wife && (
          <TaskGroupCard
            title={`${wife.name}の担当`}
            tasks={wifeTasks}
            completedCount={wifeCompleted}
            onToggle={toggleTask}
            accentClass="bg-chart-2/10 text-chart-2"
          />
        )}
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              プロフィールが見つかりません。パートナーを招待してください。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick link to full task list */}
      <Button variant="outline" className="w-full" asChild>
        <Link href="/tasks">
          タスク一覧を見る
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function TaskGroupCard({
  title,
  tasks,
  completedCount,
  onToggle,
  accentClass,
}: {
  title: string
  tasks: { id: string; title: string; isCompleted: boolean; durationMinutes?: number; category?: string }[]
  completedCount: number
  onToggle: (id: string) => void
  accentClass: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="font-normal">
            {completedCount}/{tasks.length}
          </Badge>
        </div>
        {tasks.length > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            タスクがありません
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(task.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(task.id) } }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={() => onToggle(task.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`${task.title}を${task.isCompleted ? "未完了" : "完了"}にする`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.category && (
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${accentClass}`}>
                      {task.category}
                    </span>
                  )}
                  {task.durationMinutes && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.durationMinutes}{"分"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
