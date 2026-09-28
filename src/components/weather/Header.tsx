import { useState } from "react";
import { LocateFixed, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import type { Unit } from "@/lib/weather/types";

interface Props {
  unit: Unit;
  onUnit: (u: Unit) => void;
  dark: boolean;
  onToggleTheme: () => void;
  onLocate: () => void;
  locating: boolean;
}

const NAV = [
  { href: "#home", label: "Home" },
  { href: "#forecast", label: "Forecast" },
  { href: "#details", label: "Details" },
];

export function Header({ unit, onUnit, dark, onToggleTheme, onLocate, locating }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="glass mx-auto flex max-w-7xl items-center gap-3 rounded-2xl px-4 py-2.5">
        <a href="#home" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight">WeatherNow</span>
        </a>
        <nav aria-label="Main" className="ml-6 hidden gap-1 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="Temperature unit" className="flex rounded-xl bg-muted p-0.5 text-sm font-semibold">
            {(["C", "F"] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => onUnit(u)}
                aria-pressed={unit === u}
                className={`rounded-lg px-2.5 py-1 transition ${unit === u ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                °{u}
              </button>
            ))}
          </div>
          <button onClick={onToggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="grid h-9 w-9 place-items-center rounded-xl bg-muted transition hover:bg-secondary">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={onLocate} disabled={locating} className="hidden items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:flex">
            <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} /> Use My Location
          </button>
          <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-xl bg-muted md:hidden">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="glass mx-auto mt-2 flex max-w-7xl flex-col rounded-2xl p-2 md:hidden">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
              {n.label}
            </a>
          ))}
          <button onClick={() => { setOpen(false); onLocate(); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left font-medium hover:bg-muted sm:hidden">
            <LocateFixed className="h-4 w-4" /> Use My Location
          </button>
        </nav>
      )}
    </header>
  );
}
