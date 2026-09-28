import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { getCitySuggestions } from "@/lib/weather/weatherService";
import type { Place } from "@/lib/weather/types";

interface Props {
  onSearch: (query: string) => void;
  onSelect: (place: Place) => void;
  onLocate: () => void;
  busy: boolean;
  locating: boolean;
}

export function SearchBar({ onSearch, onSelect, onLocate, busy, locating }: Props) {
  const [q, setQ] = useState("");
  const [hint, setHint] = useState("");
  const [items, setItems] = useState<Place[]>([]);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      getCitySuggestions(q, ctrl.signal).then((r) => { setItems(r); setActive(-1); }).catch(() => setItems([]));
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (p: Place) => { setQ(p.name); setOpen(false); setHint(""); onSelect(p); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && items[active]) return pick(items[active]);
    if (!q.trim()) { setHint("Please enter a city name."); return; }
    setHint(""); setOpen(false); onSearch(q.trim());
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={wrap} className="relative w-full">
      <form onSubmit={submit} role="search" className="flex flex-col gap-2 sm:flex-row">
        <div className="glass relative flex flex-1 items-center rounded-2xl">
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" aria-hidden />
          <label htmlFor="city" className="sr-only">Search city</label>
          <input
            id="city"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); if (hint) setHint(""); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="Search city..."
            autoComplete="off"
            role="combobox"
            aria-expanded={open && items.length > 0}
            aria-controls="city-list"
            aria-invalid={!!hint}
            className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-60 sm:flex-none">
            <Search className="h-4 w-4" /> Search
          </button>
          <button type="button" onClick={onLocate} disabled={locating} aria-label="Use my location" className="glass flex h-14 items-center justify-center gap-2 rounded-2xl px-4 font-semibold transition hover:bg-muted disabled:opacity-60">
            <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
            <span className="hidden lg:inline">My Location</span>
          </button>
        </div>
      </form>
      {hint && <p role="alert" className="mt-2 pl-2 text-sm font-medium text-destructive">{hint}</p>}
      {open && items.length > 0 && (
        <ul id="city-list" role="listbox" className="glass absolute left-0 right-0 top-16 z-30 overflow-hidden rounded-2xl bg-popover p-1.5 sm:right-44">
          {items.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? "bg-muted" : "hover:bg-muted"}`}>
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium">{p.name}</span>
                <span className="truncate text-sm text-muted-foreground">{[p.region, p.country].filter(Boolean).join(", ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
