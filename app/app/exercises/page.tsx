import { Suspense } from "react"
import { ExercisesApp } from "@/components/exercises/exercises-app"

// Suspense because ExercisesApp reads useSearchParams (the ?topic= deep link);
// without a boundary that would force the whole route dynamic.
export default function ExercisesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ExercisesApp />
    </Suspense>
  )
}
