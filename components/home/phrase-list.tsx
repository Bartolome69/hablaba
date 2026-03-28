import { Bookmark } from "lucide-react"
import type { SavedPhrase } from "@/lib/types"

interface PhraseListProps {
  phrases: SavedPhrase[]
  totalCount: number
}

export function PhraseList({ phrases, totalCount }: PhraseListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          Review phrases
        </h3>
        <span className="text-xs text-muted-foreground">{totalCount} saved</span>
      </div>
      <div className="space-y-2">
        {phrases.map((phrase) => (
          <div
            key={phrase.id}
            className="bg-card border border-border rounded-lg p-3"
          >
            <p className="text-sm font-medium text-foreground">{phrase.spanish}</p>
            <p className="text-xs text-muted-foreground">{phrase.english}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
