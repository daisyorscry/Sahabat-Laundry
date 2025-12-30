"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import ThemeToggle from "@/components/theme/ThemeButton";

type Item = { href: string; label: string };

const NAV: Item[] = [
  { href: "#services", label: "Layanan & Harga" },
  { href: "#how-it-works", label: "Cara Kerja" },
  { href: "#blog", label: "Blog" },
  { href: "#faq", label: "FAQ" },
  { href: "#testimonials", label: "Testimoni" },
  { href: "#contact", label: "Kontak" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("");

  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 6));

  useEffect(() => {
    const ids = NAV.map((n) => n.href.replace("#", ""));
    const sections = ids
      .map((id) => (typeof document !== "undefined" ? document.getElementById(id) : null))
      .filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveHash(`#${visible.target.id}`);
      },
      {
        root: null,
        rootMargin: "0px 0px -60% 0px",
        threshold: [0.2, 0.4, 0.6, 0.8],
      }
    );

    sections.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onHash = () => setActiveHash(window.location.hash);
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const current = useMemo(() => activeHash || "", [activeHash]);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled ? "rgba(17,17,17,0.04)" : "rgba(0,0,0,0)",
        boxShadow: scrolled ? "0 6px 24px rgba(0,0,0,.08)" : "0 0 0 rgba(0,0,0,0)",
      }}
      className={clsx(
        "border-border sticky top-0 z-50 border-b",
        "backdrop-blur supports-[backdrop-filter]:backdrop-blur-md",
        "bg-background/80 sticky"
      )}
    >
      <motion.div
        aria-hidden
        className="bg-brand-500 h-1"
        style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%" }}
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="text-foreground font-semibold tracking-tight">
          Sahabat Laundry
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-6">
            {NAV.map((n) => {
              const isActive = current === n.href;
              return (
                <li key={n.href} className="relative">
                  <a
                    href={n.href}
                    className={clsx(
                      "text-sm transition-colors",
                      isActive ? "text-foreground" : "text-foreground/80 hover:text-foreground"
                    )}
                  >
                    {n.label}
                  </a>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="bg-brand-500 absolute right-0 -bottom-1 left-0 h-[2px]"
                      transition={{ type: "spring", stiffness: 700, damping: 40, mass: 0.3 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <ThemeToggle />
          
          <Link
            href="/order"
            className="border-border text-primary hover:bg-brand-50 rounded border px-3 py-1.5 text-sm transition-colors"
          >
            Pesan Sekarang
          </Link>
        </nav>

        <button
          className="text-foreground/90 ring-offset-background focus:ring-brand-300 rounded px-2 py-1 focus:ring-2 focus:outline-none md:hidden"
          aria-label="Toggle Menu"
          onClick={() => setOpen((s) => !s)}
        >
          ☰
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="border-border bg-background border-t md:hidden"
          >
            <div className="mx-auto max-w-6xl px-4 py-3">
              <ul className="flex flex-col gap-2">
                {NAV.map((n) => {
                  const isActive = current === n.href;
                  return (
                    <li key={n.href}>
                      <a
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={clsx(
                          "block rounded px-1.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-brand-50 text-foreground"
                            : "text-foreground/90 hover:bg-brand-50/60"
                        )}
                      >
                        {n.label}
                      </a>
                    </li>
                  );
                })}
                <li className="pt-1">
                  <ThemeToggle />
                </li>
                <li className="pt-1">
                  <Link
                    href="/order"
                    onClick={() => setOpen(false)}
                    className="border-border block rounded border px-3 py-2 text-sm"
                  >
                    Pesan Sekarang
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
