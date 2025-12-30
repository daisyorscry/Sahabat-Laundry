"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
};

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Tips Merawat Pakaian agar Tahan Lama",
    excerpt: "Pelajari cara tepat merawat berbagai jenis kain untuk memperpanjang usia pakai pakaian Anda.",
    date: "15 Okt 2024",
    category: "Tips & Trik",
    readTime: "5 min"
  },
  {
    id: "2",
    title: "Mengenal Jenis Deterjen dan Kegunaannya",
    excerpt: "Perbedaan antara deterjen cair, bubuk, dan dry cleaning serta kapan harus menggunakannya.",
    date: "12 Okt 2024",
    category: "Edukasi",
    readTime: "4 min"
  },
  {
    id: "3",
    title: "Manfaat Express Laundry untuk Profesional Sibuk",
    excerpt: "Bagaimana layanan laundry kilat dapat membantu Anda yang memiliki jadwal padat.",
    date: "10 Okt 2024",
    category: "Lifestyle",
    readTime: "3 min"
  }
];

export default function BlogPreview() {
  return (
    <section id="blog" className="py-16 md:py-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Blog & Tips</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Artikel bermanfaat tentang perawatan pakaian dan lifestyle
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-background rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="bg-gray-200 border-2 border-dashed w-full h-48" />
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium px-2 py-1 bg-brand-500/10 text-brand-500 rounded">
                    {post.category}
                  </span>
                  <span className="text-xs text-foreground/60">{post.readTime} baca</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{post.title}</h3>
                <p className="text-foreground/70 mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">{post.date}</span>
                  <Link href={`/blog/${post.id}`} className="text-brand-500 hover:underline text-sm font-medium">
                    Baca selengkapnya →
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-brand-500 hover:underline font-medium"
          >
            Lihat semua artikel
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}