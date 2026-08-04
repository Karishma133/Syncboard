export function Button({ variant = "primary", className = "", ...props }) {
  const variants = {
    primary:
      "bg-ink text-mist hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed",
    accent:
      "bg-sync-teal text-ink font-semibold hover:brightness-95 disabled:opacity-40",
    ghost: "bg-transparent text-ink/70 hover:bg-ink/5",
    danger: "bg-transparent text-sync-coral hover:bg-sync-coral/10",
  };
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`focus-ring w-full rounded-lg border border-ink/12 bg-paper px-3 py-2 text-sm placeholder:text-ink/40 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`focus-ring w-full rounded-lg border border-ink/12 bg-paper px-3 py-2 text-sm placeholder:text-ink/40 ${className}`}
      {...props}
    />
  );
}

const AVATAR_COLORS = [
  "bg-sync-teal", "bg-sync-violet", "bg-sync-coral", "bg-sync-amber",
];

export function hashToIndex(str = "", mod = AVATAR_COLORS.length) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

const SIZE_CLASSES = {
  5: "h-5 w-5",
  6: "h-6 w-6",
  7: "h-7 w-7",
  8: "h-8 w-8",
  10: "h-10 w-10",
};

export function Avatar({ name = "?", size = 8, className = "" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = AVATAR_COLORS[hashToIndex(name)];
  return (
    <div
      title={name}
      className={`flex ${SIZE_CLASSES[size] || SIZE_CLASSES[8]} shrink-0 items-center justify-center rounded-full ${color} text-[11px] font-semibold text-ink/90 ring-2 ring-paper ${className}`}
    >
      {initials || "?"}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-sync-teal ${className}`}
    />
  );
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-ink/55">{subtitle}</p>}
      {action}
    </div>
  );
}
