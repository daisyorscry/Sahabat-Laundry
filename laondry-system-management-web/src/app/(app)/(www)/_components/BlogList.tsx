"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  slug: string;
};

// In a real app, this would come from an API or CMS
const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Tips Merawat Pakaian agar Tahan Lama",
    excerpt: "Pelajari cara tepat merawat berbagai jenis kain untuk memperpanjang usia pakai pakaian Anda.",
    date: "15 Okt 2024",
    category: "Tips & Trik",
    readTime: "5 min",
    slug: "tips-merawat-pakaian-agara-tahan-lama",
  },
  {
    id: "2",
    title: "Mengenal Jenis Deterjen untuk Berbagai Jenis Kain",
    excerpt: "Tidak semua deterjen cocok untuk semua jenis kain. Temukan jenis deterjen yang paling sesuai untuk pakaian Anda.",
    date: "10 Okt 2024",
    category: "Tips & Trik",
    readTime: "4 min",
    slug: "mengenal-jenis-deterjen-untuk-berbagai-jenis-kain",
  },
  {
    id: "3",
    title: "Panduan Lengkap Merawat Jaket Kulit",
    excerpt: "Jaket kulit membutuhkan perawatan khusus agar tetap awet dan tidak pecah-pecah. Simak panduan lengkapnya di sini.",
    date: "5 Okt 2024",
    category: "Perawatan Pakaian",
    readTime: "6 min",
    slug: "panduan-lengkap-merawat-jaket-kulit",
  },
];

export default function BlogList() {
  const [filter, setFilter] = useState<string>("all");

  const filteredPosts = filter === "all" 
    ? blogPosts 
    : blogPosts.filter(post => post.category === filter);

  const categories = ["all", ...Array.from(new Set(blogPosts.map(post => post.category)))];

  return (
    <section id="blog" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Blog Kami</h2>
          <p className="mt-4 text-lg text-foreground/80">
            Tips dan informasi terbaru seputar perawatan pakaian
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === category
                  ? "bg-brand-500 text-white"
                  : "bg-surface text-foreground/80 hover:bg-surface/80"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group rounded-xl border border-border bg-background p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 mb-4" />
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="bg-brand-500/10 text-brand-600 dark:text-brand-300 text-xs px-2 py-1 rounded">
                  {post.category}
                </span>
                <span className="text-foreground/70 text-xs px-2 py-1 rounded">
                  {post.date}
                </span>
                <span className="text-foreground/70 text-xs px-2 py-1 rounded">
                  {post.readTime}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-foreground group-hover:text-brand-500 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>
              
              <p className="mt-3 text-foreground/70">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center text-brand-500 font-medium group-hover:underline"
              >
                Baca selengkapnya
                <svg 
                  className="ml-1 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </motion.article>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center px-6 py-3 border border-border rounded-lg text-foreground hover:bg-surface transition-colors"
          >
            Lihat Semua Artikel
            <svg 
              className="ml-2 w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}