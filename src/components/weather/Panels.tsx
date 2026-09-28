import type { ReactNode } from "react";
import { AlertTriangle, CloudSun, RotateCw, Star, History, X } from "lucide-react";
import type { Place } from "@/lib/weather/types";

export function Section({ id, title, children, action }: { id?: string; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id={id ? `${id}-h` : undefined} className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center py-10 text-center animate-rise">
      <div className="relative mb-6 animate-float">
        <div className="absolute inset-0 rounded-full bg-accent/40 blur-3xl" />
        <CloudSun className="relative h-32 w-32 text-primary drop-shadow-xl" strokeWidth={1.2} aria-hidden />
      </div>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">WeatherNow</h1>
      <p className="mt-2 text-lg text-muted-foreground">Your weather, beautifully simplified.</p>
      <p className="mt-6 text-sm font-medium">Search for a city to get started</p>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center animate-rise">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden />
      <p className="max-w-md font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />;
}

export function LoadingState() {
  return (
    <div aria-busy="true" aria-label="Loading weather" className="grid gap-6">
      <span className="sr-only">Loading weather…</span>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2"><Bone className="h-6 w-40" /><Bone className="mt-6 h-24 w-56" /><Bone className="mt-4 h-5 w-32" /></div>
        <div className="glass rounded-3xl p-6"><Bone className="h-full min-h-40 w-full" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass rounded-3xl p-5"><Bone className="h-4 w-20" /><Bone className="mt-4 h-8 w-16" /></div>)}
      </div>
      <div className="glass flex gap-3 overflow-hidden rounded-3xl p-5">
        {Array.from({ length: 10 }).map((_, i) => <Bone key={i} className="h-28 w-20 shrink-0" />)}
      </div>
    </div>
  );
}

export function CityChips({
  kind, cities, onPick, onClear, onRemove,
}: { kind: "recent" | "favorites"; cities: Place[]; onPick: (p: Place) => void; onClear?: () => void; onRemove?: (p: Place) => void }) {
  if (!cities.length) return null;
  const Icon = kind === "recent" ? History : Star;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden /> {kind === "recent" ? "Recent" : "Favorites"}
      </span>
      {cities.map((c) => (
        <span key={c.id} className="glass flex items-center rounded-full text-sm">
          <button onClick={() => onPick(c)} className="rounded-full py-1.5 pl-3 pr-2 font-medium hover:text-primary">
            {c.name}
          </button>
          {onRemove && (
            <button onClick={() => onRemove(c)} aria-label={`Remove ${c.name} from favorites`} className="mr-1 rounded-full p-1 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {onClear && (
        <button onClick={onClear} className="rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
          Clear
        </button>
      )}
    </div>
  );
}
