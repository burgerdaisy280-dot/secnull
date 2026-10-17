import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const links = [
  { to: "/", label: "IP check" },
  { to: "/scanner", label: "Port scanner" },
  { to: "/capture", label: "Capture viewer" },
  { to: "/vpn", label: "VPN setup" },
] as const;

export function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 p-4">
          <span className="mr-auto text-lg font-bold text-primary">NullShield_</span>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-primary"
              activeProps={{ className: "text-sm text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <p className="mt-2 mb-6 text-muted-foreground">{lead}</p>
        {children}
      </main>
    </div>
  );
}

export const panel = "rounded-lg border border-border bg-card p-5";
export const btn =
  "rounded border border-primary px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50";
export const field = "w-full rounded border border-border bg-muted p-2 text-foreground";
