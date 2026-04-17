import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/compare", label: "Compare" },
  { href: "/methodology", label: "Methodology" },
];

const CATEGORIES = [
  { href: "/category/llm", label: "LLMs" },
  { href: "/category/coding", label: "Coding" },
  { href: "/category/agents", label: "Agents" },
  { href: "/category/infra", label: "Infra" },
  { href: "/category/vertical", label: "Vertical" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <line x1="12" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          AIRadar
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}

          <div className="relative group">
            <button className="text-sm text-muted hover:text-foreground transition-colors">
              Categories ▾
            </button>
            <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="block px-4 py-2 text-sm hover:bg-primary/5 first:rounded-t-lg last:rounded-b-lg"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
