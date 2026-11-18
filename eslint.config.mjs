// ESLint flat config: Next.js core-web-vitals + TypeScript rules.
// `npm run lint` runs this. Generated shadcn/ui components are left as the CLI
// writes them (CLAUDE.md: don't hand-edit components/ui).
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const config = [
  ...nextVitals,
  ...nextTs,
  {
    // These two come from the React Compiler rule set, and this app doesn't
    // use the compiler. Both flag deliberate patterns: reading localStorage in
    // an effect after mount (avoids a hydration mismatch, see every page's
    // "client-only" comment), and the latest-value ref (`ref.current = x`
    // during render) the voice engine relies on. Kept visible as warnings.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "public/**", "components/ui/**", "next-env.d.ts"],
  },
]

export default config
