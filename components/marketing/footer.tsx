import Link from "next/link"
import { WaitlistForm } from "@/components/marketing/waitlist-form"

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-serif text-2xl font-semibold tracking-tight">Hablaba</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Spanish for daily life — for parents raising bilingual kids and learners getting fluent.
            </p>
            <div className="mt-5">
              <WaitlistForm placement="footer" />
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-4 text-sm sm:justify-self-end">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">For</p>
              <Link href="/for/parents" className="hover:underline">Parents</Link>
              <Link href="/for/toddlers" className="hover:underline">Toddlers</Link>
              <Link href="/for/b1-learners" className="hover:underline">B1 learners</Link>
              <Link href="/for/travelers" className="hover:underline">Travelers</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
              <Link href="/app/practice" className="hover:underline">Try it free</Link>
            </div>
          </nav>
        </div>
        <p className="mt-12 text-xs text-muted-foreground">© {new Date().getFullYear()} Hablaba</p>
      </div>
    </footer>
  )
}
