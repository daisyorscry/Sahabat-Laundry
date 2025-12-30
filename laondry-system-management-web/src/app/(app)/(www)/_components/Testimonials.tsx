"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

export type Testimonial = { name: string; text: string };

export default function Testimonials({ items }: { items: Testimonial[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Duplicate items for seamless looping
  const allItems = [...items, ...items];

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Apa Kata Mereka</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Pengalaman pelanggan dengan layanan kami
          </p>
        </div>
        
        {/* Testimonials container with horizontal scroll effect */}
        <div 
          ref={containerRef}
          className="relative w-full overflow-hidden py-4"
        >
          <div className="flex gap-6" style={{ animation: "scroll 30s linear infinite" }}>
            {allItems.map((testimonial, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-80"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-full w-12 h-12" />
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="flex text-amber-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground/80 italic">&quot;{testimonial.text}&quot;</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-brand-500">1000+</div>
              <div className="text-foreground/70 mt-1">Pelanggan</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-brand-500">98%</div>
              <div className="text-foreground/70 mt-1">Kepuasan</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-brand-500">24J</div>
              <div className="text-foreground/70 mt-1">Express</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}