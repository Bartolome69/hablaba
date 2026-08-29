import Link from "next/link"
import { WaitlistForm } from "@/components/marketing/waitlist-form"

export function Footer() {
  return (
    <footer className="border-t border-rule bg-sunken/50">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-serif text-[26px] tracking-[-0.02em] text-green">Hablaba</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
              Spanish for daily life — for parents raising bilingual kids and learners getting
              past B1.
            </p>
            <div className="mt-5">
              <WaitlistForm placement="footer" />
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-6 text-sm sm:justify-self-end">
            <div className="flex flex-col gap-2.5">
              <p className="smallcaps text-ink-faint">Free practice</p>
              <Link href="/gramatica" className="text-ink-muted hover:text-ink">Spanish grammar</Link>
              <Link href="/frases" className="text-ink-muted hover:text-ink">Phrase packs</Link>
              <Link href="/frases/bath" className="text-ink-muted hover:text-ink">Bath-time Spanish</Link>
              <Link href="/frases/bedtime" className="text-ink-muted hover:text-ink">Bedtime Spanish</Link>
              <Link href="/gramatica/ser-vs-estar" className="text-ink-muted hover:text-ink">Ser vs estar</Link>
              <Link href="/gramatica/por-vs-para" className="text-ink-muted hover:text-ink">Por vs para</Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="smallcaps text-ink-faint">For</p>
              <Link href="/for/parents" className="text-ink-muted hover:text-ink">Parents</Link>
              <Link href="/for/toddlers" className="text-ink-muted hover:text-ink">Toddlers</Link>
              <Link href="/for/b1-learners" className="text-ink-muted hover:text-ink">B1 learners</Link>
              <Link href="/for/travelers" className="text-ink-muted hover:text-ink">Travelers</Link>
              <p className="smallcaps mt-3 text-ink-faint">Product</p>
              <Link href="/app/today" className="text-ink-muted hover:text-ink">Try it free</Link>
            </div>
          </nav>
        </div>
        <p className="mt-12 text-xs text-ink-soft">© {new Date().getFullYear()} Hablaba</p>
      </div>
    </footer>
  )
}
