"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "hablaba_streak"

interface StreakData {
  count: number
  lastDate: string // YYYY-MM-DD in local timezone
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getYesterday(todayStr: string): string {
  const d = new Date(todayStr + "T12:00:00") // noon to avoid DST edge cases
  d.setDate(d.getDate() - 1)
  return toLocalDateString(d)
}

export function useStreak(): number {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const today = toLocalDateString(new Date())
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: 1, lastDate: today }))
      setCount(1)
      return
    }

    const data: StreakData = JSON.parse(raw)

    if (data.lastDate === today) {
      setCount(data.count)
      return
    }

    const yesterday = getYesterday(today)
    const newCount = data.lastDate === yesterday ? data.count + 1 : 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, lastDate: today }))
    setCount(newCount)
  }, [])

  return count
}
