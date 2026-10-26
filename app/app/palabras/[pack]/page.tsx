import { notFound } from "next/navigation"
import { PackPage } from "@/components/vocab/pack-page"
import { isPackId } from "@/lib/vocab/catalog"

export default async function PackRoute({ params }: { params: Promise<{ pack: string }> }) {
  const { pack } = await params
  if (pack !== "propias" && !isPackId(pack)) notFound()
  return <PackPage packId={pack} />
}
