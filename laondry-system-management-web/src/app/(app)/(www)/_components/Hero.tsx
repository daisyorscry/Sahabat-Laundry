"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { easeOut, motion, useMotionValue, useSpring, useTransform, Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export default function Hero() {
  // spotlight
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.3 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.3 });
  const spotX = useTransform(sx, (v) => `${v * 100}%`);
  const spotY = useTransform(sy, (v) => `${v * 100}%`);

  const onMouseMove = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width);
      my.set((e.clientY - r.top) / r.height);
    },
    [mx, my]
  );

  return (
    <section id="#home" className="relative isolate overflow-hidden" onMouseMove={onMouseMove}>
      {/* BG image full hero */}
      <Image
        src="/hero-laondry.webp"
        alt="Laundry hero"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Overlay untuk keterbacaan */}
      <div className="from-background/80 via-background/50 to-background/20 md:from-background/70 pointer-events-none absolute inset-0 bg-gradient-to-l" />

      {/* Spotlight */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <motion.div
          className="h-full w-full"
          style={
            {
              "--sx": spotX,
              "--sy": spotY,
              background:
                "radial-gradient(320px 320px at var(--sx,50%) var(--sy,50%), color-mix(in oklch, var(--brand-400) 25%, transparent), transparent 60%)",
              mixBlendMode: "soft-light",
              opacity: 0.35,
              WebkitMaskImage:
                "radial-gradient(240px 240px at var(--sx,50%) var(--sy,50%), #000 35%, transparent 65%)",
            } as React.CSSProperties
          }
        />
      </motion.div>

      {/* Decorative elements for more elegance */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl" />

      {/* Content kanan */}
      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl px-4 py-16 md:min-h-[80vh] md:py-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="ml-auto w-full text-right md:max-w-xl"
        >
          {/* badge */}
          <motion.div
            variants={itemUp}
            className="border-border bg-surface/60 text-foreground/70 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm shadow-sm"
          >
            <span className="bg-brand-500 inline-block h-2.5 w-2.5 rounded-full" />
            <span>Terpercaya sejak 2019</span>
          </motion.div>

          {/* title + shimmer */}
          <motion.h1
            variants={itemUp}
            className="text-foreground mt-6 text-3xl leading-tight font-bold md:text-5xl"
          >
            <span className="font-light block">Laundry Bersih, Cepat,</span>
            <span className="block mt-1">Praktis — </span>
            <span className="relative inline-block mt-1">
              <span className="from-brand-500 to-brand-300 bg-gradient-to-r bg-clip-text text-transparent">
                Antar Jemput
              </span>
              <motion.span
                aria-hidden
                initial={{ x: "-120%" }}
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 1.4, ease: "easeInOut", delay: 0.6 }}
                className="pointer-events-none absolute -inset-x-10 inset-y-0 skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ mixBlendMode: "overlay" }}
              />
            </span>
          </motion.h1>

          <motion.p variants={itemUp} className="text-foreground/80 mt-6 text-base md:text-lg leading-relaxed">
            Solusi laundry hemat waktu dengan layanan antar jemput terbaik di Kendari. 
            Hasil bersih, wangi, rapi dalam waktu 24 jam.
          </motion.p>

          {/* CTA (align kanan) */}
          <motion.div variants={itemUp} className="mt-8 flex flex-wrap justify-end gap-4">
            <Link
              href="#order"
              className="group bg-brand-500 text-on-primary focus:ring-brand-300 relative overflow-hidden rounded-xl px-7 py-3.5 text-base font-medium shadow-lg transition-all duration-300 focus:ring-2 focus:outline-none hover:shadow-xl hover:scale-[1.02]"
            >
              <span>Pesan Sekarang</span>
              <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
            </Link>
            <a
              href="#services"
              className="border-border text-primary hover:bg-brand-50 focus:ring-brand-300 rounded-xl border px-7 py-3.5 text-base font-medium transition focus:ring-2 focus:outline-none hover:scale-[1.02]"
            >
              Lihat Layanan
            </a>
          </motion.div>

          {/* poin keunggulan */}
          <motion.div
            variants={itemUp}
            className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-4"
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-500 inline-block h-3.5 w-3.5 rounded-full" />
                <span className="text-sm font-medium">Gratis antar-jemput</span>
              </div>
              <p className="text-foreground/60 text-xs mt-1 text-right">*Wilayah terpilih</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-500 inline-block h-3.5 w-3.5 rounded-full" />
                <span className="text-sm font-medium">Express 24 jam</span>
              </div>
              <p className="text-foreground/60 text-xs mt-1 text-right">Proses cepat</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-500 inline-block h-3.5 w-3.5 rounded-full" />
                <span className="text-sm font-medium">Higienis</span>
              </div>
              <p className="text-foreground/60 text-xs mt-1 text-right">Deterjen aman</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-500 inline-block h-3.5 w-3.5 rounded-full" />
                <span className="text-sm font-medium">Harga terjangkau</span>
              </div>
              <p className="text-foreground/60 text-xs mt-1 text-right">Transparan</p>
            </div>
          </motion.div>

          {/* trust bar */}
          <motion.div
            variants={itemUp}
            className="text-foreground/70 mt-12 flex flex-wrap items-center justify-end gap-6 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <span className="font-medium">4.9/5</span>
            </div>
            <span aria-hidden className="bg-border h-4 w-px" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>Kendari</span>
            </span>
            <span aria-hidden className="bg-border h-4 w-px" />
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>1000+ pelanggan</span>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}