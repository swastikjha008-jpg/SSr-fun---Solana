"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LINKS, NAV } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = NAV.map((n) => document.querySelector(n.href)).filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open ? "glass border-x-0 border-t-0" : "border-b border-transparent"
      )}
    >
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="shrink-0 whitespace-nowrap font-display text-lg font-bold tracking-tight text-white">
          SSR<span className="text-accent-soft">.</span>FUN
          <span className="ml-2 hidden text-[10px] font-medium uppercase tracking-[0.2em] text-white/60 lg:inline">
            Beta Challenge
          </span>
        </a>

        <ul className="hidden items-center gap-0.5 whitespace-nowrap md:flex lg:gap-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active === item.href ? "location" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-sm transition-colors hover:text-white lg:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft",
                  active === item.href ? "text-white" : "text-white/65"
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={LINKS.platform}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg border lg:ml-2 border-white/15 px-3.5 py-2 text-sm text-white transition-colors hover:border-accent-soft/60 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
            >
              SSR.FUN <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </li>
        </ul>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg text-white md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 px-5 pb-5 pt-2 md:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 text-base text-white/80 hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={LINKS.platform}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2 py-3 text-base text-accent-soft"
              >
                Visit SSR.FUN <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
