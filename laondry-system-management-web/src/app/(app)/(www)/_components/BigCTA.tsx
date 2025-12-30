"use client";

import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

import Button from "@/components/button/Button";

export default function BigCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
          className="bg-gradient-to-br from-surface to-background border border-border rounded-3xl p-8 md:p-12 shadow-xl"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-sm">
                <span className="bg-brand-500 inline-block h-2 w-2 rounded-full" />
                <span className="text-foreground/90">Terpercaya sejak 2019</span>
              </div>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold text-foreground">
                Jangan Tunda Lagi! 
                <span className="text-brand-500"> Pesan Sekarang</span> dan Nikmati Kenyamanan Laundry
              </h2>
              <p className="text-foreground/80 mt-4 text-lg max-w-xl mx-auto">
                Dapatkan layanan laundry terbaik dengan antar jemput gratis dan hasil memuaskan. 
                Hemat waktu, hemat tenaga, pakaian bersih dan rapi!
              </p>
              
              <div className="mt-8 flex flex-wrap items-center justify-start gap-4">
                <Button href="/order" variant="solid" tone="primary" size="md" className="px-6 py-3 text-base">
                  Pesan Sekarang
                </Button>

                <Button as="a" href="#contact" variant="outline" tone="neutral" size="md" className="px-6 py-3 text-base">
                  Hubungi Kami
                </Button>

                <Button
                  as="a"
                  href="https://wa.me/62xxxxxxxxxx"
                  variant="outline"
                  tone="primary"
                  size="md"
                  leftIcon={<FaWhatsapp className="h-4 w-4" />}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 text-base"
                >
                  Chat WhatsApp
                </Button>
              </div>
              
              <div className="mt-10 flex flex-wrap justify-start gap-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-brand-500">1000+</div>
                  <div className="text-foreground/70 mt-1">Pelanggan Puas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-500">24J</div>
                  <div className="text-foreground/70 mt-1">Express Selesai</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-500">98%</div>
                  <div className="text-foreground/70 mt-1">Kepuasan</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-gray-200 border-2 border-dashed rounded-2xl w-full h-80" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}