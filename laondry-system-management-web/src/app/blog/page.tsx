import Link from "next/link";
import { notFound } from "next/navigation";

// In a real app, this would come from an API or CMS
const blogPosts = [
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

export default function BlogPage() {
  return (
    <div className="min-h-dvh py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground">Blog Kami</h1>
          <p className="mt-4 text-lg text-foreground/70">
            Tips dan informasi terbaru seputar perawatan pakaian
          </p>
        </div>

        <div className="space-y-12">
          {blogPosts.map((post) => (
            <article 
              key={post.id}
              className="border-b border-border pb-12 last:border-0 last:pb-0"
            >
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 mb-6" />
              
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="bg-brand-500/10 text-brand-600 dark:text-brand-300 text-sm px-3 py-1 rounded">
                  {post.category}
                </span>
                <span className="text-foreground/70 text-sm px-3 py-1 rounded">
                  {post.date}
                </span>
                <span className="text-foreground/70 text-sm px-3 py-1 rounded">
                  {post.readTime}
                </span>
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">
                <Link 
                  href={`/blog/${post.slug}`} 
                  className="hover:text-brand-500 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-foreground/80 mb-4 text-lg">
                {post.excerpt}
              </p>
              
              <Link 
                href={`/blog/${post.slug}`}
                className="inline-flex items-center text-brand-500 font-medium hover:underline"
              >
                Baca selengkapnya
                <svg 
                  className="ml-2 w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}