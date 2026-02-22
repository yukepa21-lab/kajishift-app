"use client"

import { useState, useMemo } from "react"
import { useApp } from "@/lib/store"
import { SHIFT_TYPES, type ShiftType } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

export function ShiftContent() {
  const { user, upsertShift, getShift } = useApp()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const userId = user?.id ?? ""

  const baseDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate])

  const selectedDateStr = toDateStr(selectedDate)
  const currentShift = getShift(userId, selectedDateStr)
  const [localShift, setLocalShift] = useState<ShiftType | null>(currentShift?.shiftType ?? null)

  // sync localShift when date changes
  useMemo(() => {
    const shift = getShift(userId, selectedDateStr)
    setLocalShift(shift?.shiftType ?? null)
    setSaved(false)
    return selectedDateStr
  }, [selectedDateStr, userId, getShift])

  async function handleSave() {
    if (!localShift || !userId) return
    setSaving(true)
    try {
      await upsertShift(userId, selectedDateStr, localShift)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // handle error silently
    } finally {
      setSaving(false)
    }
  }

  const todayStr = toDateStr(new Date())

  // Week header text
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]
  const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">シフト登録</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          日付を選んでシフトを登録してください
        </p>
      </div>

      {/* Week calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((p) => p - 1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">前の週</span>
            </Button>
            <CardTitle className="text-sm font-medium">{weekLabel}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((p) => p + 1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">次の週</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((date, i) => {
              const dateStr = toDateStr(date)
              const isSelected = dateStr === selectedDateStr
              const isToday = dateStr === todayStr
              const shift = getShift(userId, dateStr)
              const shiftInfo = shift ? SHIFT_TYPES.find((s) => s.type === shift.shiftType) : null

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2 px-1 transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-medium",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={cn(
                    "text-sm font-bold",
                    isToday && !isSelected && "text-primary"
                  )}>
                    {date.getDate()}
                  </span>
                  <span className="text-base leading-none">
                    {shiftInfo ? shiftInfo.icon : "\u00A0"}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Shift type selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {selectedDate.getMonth() + 1}{"月"}{selectedDate.getDate()}{"日のシフト"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {SHIFT_TYPES.map((shift) => {
              const isActive = localShift === shift.type
              return (
                <button
                  key={shift.type}
                  onClick={() => setLocalShift(shift.type)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-4 transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                >
                  <span className="text-2xl">{shift.icon}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {shift.label}
                  </span>
                  {isActive && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </button>
              )
            })}
          </div>

          <Button
            onClick={handleSave}
            disabled={!localShift || saving}
            className="w-full"
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                保存しました
              </span>
            ) : saving ? (
              "保存中..."
            ) : (
              "保存する"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">今週のシフト一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {weekDates.map((date, i) => {
              const dateStr = toDateStr(date)
              const shift = getShift(userId, dateStr)
              const shiftInfo = shift ? SHIFT_TYPES.find((s) => s.type === shift.shiftType) : null
              const isToday = dateStr === todayStr

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">
                      {DAY_LABELS[i]}
                    </span>
                    <span className={cn(
                      "text-sm",
                      isToday ? "font-bold text-primary" : "text-foreground"
                    )}>
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                    {isToday && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        今日
                      </Badge>
                    )}
                  </div>
                  {shiftInfo ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>{shiftInfo.icon}</span>
                      <span className="font-medium text-foreground">{shiftInfo.label}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
