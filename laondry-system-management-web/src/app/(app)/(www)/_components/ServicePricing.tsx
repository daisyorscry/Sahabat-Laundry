"use client";

import { motion } from "framer-motion";
import { FaTshirt, FaBoxOpen, FaSteam, FaBolt, FaUmbrellaBeach } from "react-icons/fa";
import { TbCheck } from "react-icons/tb";

const services = [
  {
    id: 1,
    title: "Cuci Kering",
    desc: "Proses pencucian standar hingga pakaian kering dan siap disimpan.",
    icon: <FaTshirt className="h-6 w-6 text-brand-500" />,
    pricing: [
      {
        name: "Reguler",
        price: "Rp7.000/kg",
        features: ["Cuci + Kering", "Estimasi 48 jam", "Setrika jika diminta", "Pengantaran gratis"],
        cta: { href: "/order", label: "Pesan Sekarang" },
      }
    ]
  },
  {
    id: 2,
    title: "Cuci Lipat",
    desc: "Pencucian hingga rapi, dilipat dan disusun dengan rapi.",
    icon: <FaBoxOpen className="h-6 w-6 text-brand-500" />,
    pricing: [
      {
        name: "Reguler",
        price: "Rp7.000/kg",
        features: ["Cuci + Lipat", "Estimasi 48 jam", "Pengantaran gratis"],
        cta: { href: "/order", label: "Pesan Sekarang" },
      }
    ]
  },
  {
    id: 3,
    title: "Setrika",
    desc: "Pakaian disetrika hingga halus dan licin.",
    icon: <FaSteam className="h-6 w-6 text-brand-500" />,
    pricing: [
      {
        name: "Setrika Saja",
        price: "Rp5.000/kg",
        features: ["Setrika rapi", "Pengantaran gratis", "Kualitas terjamin"],
        cta: { href: "/order", label: "Pesan Sekarang" },
      }
    ]
  },
  {
    id: 4,
    title: "Express 24 Jam",
    desc: "Prioritas selesai dalam waktu maksimal 24 jam.",
    icon: <FaBolt className="h-6 w-6 text-brand-500" />,
    pricing: [
      {
        name: "Express",
        price: "Rp10.000/kg",
        features: ["Prioritas utama", "Selesai 24 jam", "Free setrika", "Pengantaran gratis"],
        cta: { href: "/order", label: "Pesan Sekarang" },
        popular: true,
      }
    ]
  },
  {
    id: 5,
    title: "Dry Cleaning",
    desc: "Pencucian kering untuk pakaian yang tidak bisa dicuci biasa.",
    icon: <FaUmbrellaBeach className="h-6 w-6 text-brand-500" />,
    pricing: [
      {
        name: "Dry Cleaning",
        price: "Rp12.000/kg",
        features: ["Perlakuan khusus", "Pakaian mewah", "Garansi hasil", "Pengantaran gratis"],
        cta: { href: "/order", label: "Pesan Sekarang" },
      }
    ]
  },
  {
    id: 6,
    title: "Laundry Premium",
    desc: "Layanan premium untuk pakaian mewah dan khusus.",
    icon: <FaUmbrellaBeach className="h-6 w-6 text-brand-500" />,
    pricing: [
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
      }
    ]
  },
];

export default function ServicePricing() {
  return (
    <section id="services" className="py-16 md:py-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Layanan & Harga</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Pilih layanan sesuai kebutuhan dan lihat harga langsung
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="rounded-xl border border-border bg-background p-6 shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/10">
                    {service.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-foreground">{service.title}</h3>
                  <p className="text-sm text-foreground/70">{service.desc}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {service.pricing.map((price, priceIndex) => (
                  <div 
                    key={priceIndex} 
                    className={`rounded-lg border p-4 ${price.popular ? "border-brand-500 bg-brand-500/5" : "border-border"}`}
                  >
                    {price.popular && (
                      <div className="mb-2">
                        <span className="bg-brand-500 text-on-primary rounded-full px-3 py-1 text-xs font-semibold">
                          Paling Populer
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-foreground">{price.name}</h4>
                      <span className="font-bold text-lg text-brand-500">{price.price}</span>
                    </div>
                    
                    <ul className="space-y-2 mb-4">
                      {price.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2 text-sm">
                          <TbCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <a
                      href={price.cta.href}
                      className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                        price.popular
                          ? "bg-brand-500 text-on-primary hover:bg-brand-600"
                          : "border border-border text-foreground hover:bg-surface"
                      }`}
                    >
                      {price.cta.label}
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-foreground/80 max-w-3xl mx-auto">
            Semua layanan kami menggunakan deterjen berkualitas tinggi dan peralatan modern 
            untuk menjaga kebersihan serta keawetan pakaian Anda. 
            <span className="font-medium text-brand-500"> Kami menjamin kepuasan pelanggan 100%</span>.
          </p>
        </div>
      </div>
    </section>
  );
}