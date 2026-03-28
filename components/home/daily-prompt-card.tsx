import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { DailyPrompt } from "@/lib/types"

interface DailyPromptCardProps {
  prompt: DailyPrompt
  onStart: () => void
}

export function DailyPromptCard({ prompt, onStart }: DailyPromptCardProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
              Today&apos;s prompt
            </p>
            <h2 className="font-serif text-lg text-foreground leading-snug mb-1">
              {prompt.spanish}
            </h2>
            <p className="text-sm text-muted-foreground">{prompt.english}</p>
          </div>
          <Button
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
            onClick={onStart}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
