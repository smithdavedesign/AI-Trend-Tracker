import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Categories</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/category/llm" className="hover:text-foreground">LLMs</Link></li>
              <li><Link href="/category/coding" className="hover:text-foreground">Coding</Link></li>
              <li><Link href="/category/agents" className="hover:text-foreground">Agents</Link></li>
              <li><Link href="/category/infra" className="hover:text-foreground">Infra</Link></li>
              <li><Link href="/category/vertical" className="hover:text-foreground">Vertical</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/compare" className="hover:text-foreground">Compare Tools</Link></li>
              <li><Link href="/graveyard" className="hover:text-foreground">Graveyard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">About</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/methodology" className="hover:text-foreground">Methodology</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted mb-2">Get weekly AI trend alerts.</p>
            <Link
              href="#subscribe"
              className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted">
          © {new Date().getFullYear()} AIRadar. Data refreshed weekly from 6 sources.
        </div>
      </div>
    </footer>
  );
}
