export type ShiftType = "日勤" | "夜勤" | "明け" | "休日"
export type Role = "夫" | "妻"
export type TaskCategory = "料理" | "洗濯" | "掃除" | "育児" | "買い物" | "その他"
export type TaskFrequency = "毎日" | "週2回" | "週3回" | "隔週" | "週1回"

export interface Profile {
  id: string
  userId: string
  name: string
  role: Role
}

export interface Shift {
  id: string
  userId: string
  date: string
  shiftType: ShiftType
}

export interface Task {
  id: string
  assigneeId: string
  title: string
  category?: TaskCategory
  durationMinutes?: number
  date: string
  isCompleted: boolean
  frequency?: TaskFrequency
}

export const SHIFT_TYPES: { type: ShiftType; icon: string; label: string }[] = [
  { type: "日勤", icon: "\u{1F305}", label: "日勤" },
  { type: "夜勤", icon: "\u{1F319}", label: "夜勤" },
  { type: "明け", icon: "\u{1F634}", label: "明け" },
  { type: "休日", icon: "\u{1F3E0}", label: "休日" },
]

export const CATEGORIES: TaskCategory[] = ["料理", "洗濯", "掃除", "育児", "買い物", "その他"]
export const FREQUENCIES: TaskFrequency[] = ["毎日", "週2回", "週3回", "隔週", "週1回"]
