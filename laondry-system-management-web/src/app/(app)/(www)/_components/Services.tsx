"use client";

import { motion } from "framer-motion";
import { FaTshirt, FaBoxOpen, FaSteam, FaBolt, FaUmbrellaBeach } from "react-icons/fa";

const items = [
  {
    title: "Cuci Kering",
    desc: "Proses pencucian standar hingga pakaian kering dan siap disimpan.",
    icon: <FaTshirt className="h-6 w-6 text-brand-500" />,
  },
  {
    title: "Cuci Lipat",
    desc: "Pencucian hingga rapi, dilipat dan disusun dengan rapi.",
    icon: <FaBoxOpen className="h-6 w-6 text-brand-500" />,
  },
  {
    title: "Setrika",
    desc: "Pakaian disetrika hingga halus dan licin.",
    icon: <FaSteam className="h-6 w-6 text-brand-500" />,
  },
  {
    title: "Express 24 Jam",
    desc: "Prioritas selesai dalam waktu maksimal 24 jam.",
    icon: <FaBolt className="h-6 w-6 text-brand-500" />,
  },
  {
    title: "Dry Cleaning",
    desc: "Pencucian kering untuk pakaian yang tidak bisa dicuci biasa.",
    icon: <FaUmbrellaBeach className="h-6 w-6 text-brand-500" />,
  },
  {
    title: "Laundry Premium",
    desc: "Layanan premium untuk pakaian mewah dan khusus.",
    icon: <FaUmbrellaBeach className="h-6 w-6 text-brand-500" />,
  },
];

export default function Services() {
  return (
    <section id="services" className="py-16 md:py-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Layanan Kami</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Pilih layanan sesuai kebutuhan dan jenis pakaian Anda.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group rounded-xl border border-border bg-background p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-40 mb-4" />
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors">
                {it.icon}
              </div>
              <h3 className="mt-5 font-semibold text-xl text-foreground">{it.title}</h3>
              <p className="mt-2 text-foreground/70">{it.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-foreground/80 max-w-2xl mx-auto">
            Semua layanan kami menggunakan deterjen berkualitas tinggi dan peralatan modern 
            untuk menjaga kebersihan serta keawetan pakaian Anda. 
            <span className="font-medium text-brand-500"> Kami menjamin kepuasan pelanggan 100%</span>.
          </p>
        </div>
      </div>
    </section>
  );
}