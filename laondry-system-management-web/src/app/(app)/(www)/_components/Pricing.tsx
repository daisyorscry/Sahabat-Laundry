"use client";

import { motion } from "framer-motion";
import { TbCheck } from "react-icons/tb";

const tiers = [
  {
    name: "Reguler",
    price: "Rp7.000/kg",
    features: ["Cuci + Kering", "Estimasi 48 jam", "Setrika jika diminta", "Pengantaran gratis"],
    cta: { href: "/order", label: "Pesan Sekarang" },
  },
  {
    name: "Express",
    price: "Rp10.000/kg",
    features: ["Prioritas utama", "Selesai 24 jam", "Free setrika", "Pengantaran gratis"],
    cta: { href: "/order", label: "Pesan Sekarang" },
    popular: true, // highlight plan ini
  },
  {
    name: "Premium",
    price: "Rp15.000/kg",
    features: ["Dry cleaning", "Perlakuan khusus", "Pakaian mewah", "Garansi hasil"],
    cta: { href: "/order", label: "Pesan Sekarang" },
  },
  {
    name: "Langganan",
    price: "Mulai Rp199.000",
    features: ["Hemat sampai 30%", "Jadwal tetap", "Layanan prioritas", "Free pickup & delivery"],
    cta: { href: "/order", label: "Pesan Sekarang" },
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Harga / Paket</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Transparan dan fleksibel sesuai kebutuhan.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className={`relative rounded-2xl border p-8 shadow-xl transition-all duration-300 ${
                t.popular
                  ? "border-brand-500 ring-2 ring-brand-500/20 bg-gradient-to-b from-background to-surface"
                  : "border-border bg-gradient-to-b from-background to-surface hover:shadow-2xl"
              }`}
            >
              {t.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-500 text-on-primary rounded-full px-4 py-1.5 text-sm font-semibold shadow-lg">
                    Paling Populer
                  </span>
                </div>
              )}
              
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-40 mb-6" />
              
              <h3 className="text-2xl font-bold text-foreground text-center">{t.name}</h3>
              <div className="mt-6 text-center">
                <p className="text-4xl font-bold text-foreground">{t.price}</p>
              </div>

              <ul className="mt-8 space-y-4">
                {t.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <TbCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={t.cta.href}
                className={`mt-10 block w-full rounded-xl px-6 py-4 text-lg font-semibold transition-all ${
                  t.popular
                    ? "bg-brand-500 text-on-primary hover:bg-brand-600 shadow-lg hover:shadow-xl"
                    : "border border-border text-foreground hover:bg-surface"
                }`}
              >
                {t.cta.label}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}