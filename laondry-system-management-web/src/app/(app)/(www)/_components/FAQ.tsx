"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Berapa lama waktu pengerjaan laundry?",
    answer: "Untuk layanan biasa, pengerjaan membutuhkan waktu 24-48 jam. Untuk layanan express, pengerjaan selesai dalam 24 jam sejak penjemputan."
  },
  {
    question: "Apakah ada biaya tambahan untuk antar jemput?",
    answer: "Tidak, layanan antar jemput gratis untuk area terpilih di Kendari. Anda hanya perlu membayar harga laundry sesuai berat dan jenis layanan."
  },
  {
    question: "Bagaimana jika ada pakaian yang rusak atau hilang?",
    answer: "Kami menjamin semua pakaian Anda. Jika terjadi kerusakan atau kehilangan akibat kesalahan kami, kami akan memberikan kompensasi sesuai dengan ketentuan yang berlaku."
  },
  {
    question: "Apakah deterjen yang digunakan aman untuk kulit sensitif?",
    answer: "Ya, kami menggunakan deterjen dan pelembut berkualitas tinggi yang aman untuk kulit sensitif dan tidak menyebabkan iritasi."
  },
  {
    question: "Apakah bisa memilih waktu penjemputan dan pengantaran?",
    answer: "Tentu! Anda bisa menentukan jadwal yang sesuai dengan kenyamanan Anda saat pemesanan."
  },
  {
    question: "Apakah tersedia layanan untuk pakaian mewah?",
    answer: "Ya, kami menyediakan layanan dry cleaning khusus untuk pakaian mewah seperti jas, gaun, dan bahan-bahan khusus lainnya."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 md:py-24 bg-surface/30">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Pertanyaan Umum</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Jawaban atas pertanyaan-pertanyaan yang sering ditanyakan
          </p>
        </div>

        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-border rounded-xl bg-background overflow-hidden"
            >
              <button
                className="flex justify-between items-center w-full p-6 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <h3 className="text-lg font-medium text-foreground">{faq.question}</h3>
                <svg 
                  className={`h-5 w-5 text-foreground/60 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-6 pb-6 text-foreground/80 border-t border-border pt-4"
                >
                  {faq.answer}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}