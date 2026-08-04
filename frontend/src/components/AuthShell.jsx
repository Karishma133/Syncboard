import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-paper shadow-pop md:grid-cols-2">
        {/* signature panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-mist md:flex">
          <div
            className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #17C9B2, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #7C6CF6, transparent 70%)" }}
          />
          <Link to="/" className="relative font-display text-xl font-semibold tracking-tight">
            Sync<span className="text-sync-teal">Board</span>
          </Link>
          <div className="relative">
            <div className="mb-5 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-sync-teal" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sync-teal" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-mist/50">
                live across every board
              </span>
            </div>
            <p className="font-display text-2xl font-medium leading-snug text-mist/95">
              Every card, list, and comment updates the moment your team moves it.
            </p>
          </div>
        </div>

        {/* form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink/55">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink/60">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
