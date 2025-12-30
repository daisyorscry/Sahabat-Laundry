import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";

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
    content: "# Tips Merawat Pakaian agar Tahan Lama\n\nMerawat pakaian dengan benar tidak hanya membuatnya terlihat lebih rapi, tetapi juga memperpanjang usia pakai. Berikut beberapa tips yang bisa Anda terapkan:\n\n## 1. Perlakukan Pakaian dengan Lembut\n\nJangan memaksa saat memakai atau melepas pakaian. Gerakan cepat dapat menyebabkan sobekan atau kusut yang sulit diperbaiki.\n\n## 2. Pisahkan Pakaian Berdasarkan Warna\n\nPisahkan pakaian putih, gelap dan warna cerah sebelum dicuci. Ini mencegah warna luntur dan pakaian menjadi kusam.\n\n## 3. Gunakan Air Dingin untuk Mencuci\n\nAir dingin melindungi warna dan tekstur kain. Air panas bisa menyusutkan dan merusak serat kain.\n\n## 4. Hindari Penggunaan Pemutih Berlebihan\n\nPemutih dapat merusak serat kain jika digunakan secara berlebihan. Gunakan hanya saat benar-benar diperlukan.\n\n## 5. Keringkan dengan Cara yang Tepat\n\nJika memungkinkan, jemur pakaian secara alami. Pengering listrik dengan panas tinggi dapat menyusutkan dan merusak kain seiring waktu."
  },
  {
    id: "2",
    title: "Mengenal Jenis Deterjen untuk Berbagai Jenis Kain",
    excerpt: "Tidak semua deterjen cocok untuk semua jenis kain. Temukan jenis deterjen yang paling sesuai untuk pakaian Anda.",
    date: "10 Okt 2024",
    category: "Tips & Trik",
    readTime: "4 min",
    slug: "mengenal-jenis-deterjen-untuk-berbagai-jenis-kain",
    content: "# Mengenal Jenis Deterjen untuk Berbagai Jenis Kain\n\nPemilihan deterjen yang tepat sangat penting untuk menjaga kualitas pakaian. Berikut adalah penjelasan tentang jenis deterjen yang sesuai dengan berbagai jenis kain:\n\n## 1. Deterjen Cair\n\nDeterjen cair sangat cocok untuk pakaian yang terbuat dari kain halus seperti sutra atau linen. Kandungan kimianya lebih ringan dan tidak meninggalkan sisa seperti deterjen bubuk.\n\n## 2. Deterjen Bubuk\n\nDeterjen bubuk lebih efektif untuk menghilangkan noda membandel, terutama pada pakaian dari kain katun atau denim. Namun, gunakan dengan takaran yang sesuai agar tidak merusak serat kain.\n\n## 3. Deterjen Berbahan Ringan\n\nUntuk pakaian bayi atau orang dengan kulit sensitif, gunakan deterjen yang bebas pewangi dan pewarna. Pilih deterjen yang diformulasikan khusus untuk kulit sensitif.\n\n## 4. Deterjen Pintar\n\nDeterjen canggih saat ini dirancang untuk bekerja efektif bahkan dalam air dingin, sehingga menghemat energi dan menjaga kualitas kain secara bersamaan."
  },
  {
    id: "3",
    title: "Panduan Lengkap Merawat Jaket Kulit",
    excerpt: "Jaket kulit membutuhkan perawatan khusus agar tetap awet dan tidak pecah-pecah. Simak panduan lengkapnya di sini.",
    date: "5 Okt 2024",
    category: "Perawatan Pakaian",
    readTime: "6 min",
    slug: "panduan-lengkap-merawat-jaket-kulit",
    content: "# Panduan Lengkap Merawat Jaket Kulit\n\nJaket kulit adalah investasi jangka panjang yang membutuhkan perawatan khusus. Berikut adalah panduan lengkap untuk merawat jaket kulit Anda:\n\n## 1. Kebersihan adalah Kunci\n\nJangan pernah mencuci jaket kulit dengan air biasa. Gunakan kain lembut yang dibasahi dengan air dan sabun khusus kulit untuk membersihkan noda ringan.\n\n## 2. Penyimpanan yang Tepat\n\nGantung jaket kulit di hanger lebar yang tidak akan menghasilkan lipatan permanen. Hindari menyimpan di tempat lembab yang bisa menyebabkan jamur.\n\n## 3. Perawatan Rutin\n\nGunakan kondisioner kulit setiap 6 bulan sekali untuk menjaga kelembutan dan menghindari pecah-pecah. Oleskan secara merata dan biarkan meresap.\n\n## 4. Perlindungan dari Sinar Matahari\n\nJauhkan jaket kulit dari sinar matahari langsung yang bisa membuatnya kering dan rapuh. Gunakan juga pelindung UV jika memungkinkan.\n\n## 5. Penanganan saat Basah\n\nJika jaket kulit Anda terkena air, biarkan kering secara alami pada suhu ruangan. Jangan gunakan pemanas atau pengering karena bisa merusak tekstur kulit."
  }
];

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug);
  
  if (!post) {
    notFound();
  }

  const contentHTML = marked(post.content);

  return (
    <div className="min-h-dvh py-16 bg-background">
      <div className="max-w-4xl mx-auto px-4">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-brand-500 hover:underline mb-8"
        >
          <svg 
            className="mr-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Kembali ke Blog
        </Link>
        
        <article>
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-80 mb-8" />
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-brand-500/10 text-brand-600 dark:text-brand-300 text-sm px-3 py-1 rounded">
              {post.category}
            </span>
            <span className="text-foreground/70 text-sm px-3 py-1 rounded">
              {post.date}
            </span>
            <span className="text-foreground/70 text-sm px-3 py-1 rounded">
              {post.readTime} baca
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-6">
            {post.title}
          </h1>
          
          <div 
            className="prose prose-lg max-w-none text-foreground/90"
            dangerouslySetInnerHTML={{ __html: contentHTML }} 
          />
        </article>
        
        <div className="mt-16 pt-8 border-t border-border">
          <h3 className="text-xl font-bold text-foreground mb-6">Artikel Lainnya</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts
              .filter(p => p.id !== post.id)
              .slice(0, 2)
              .map(otherPost => (
                <Link 
                  key={otherPost.id} 
                  href={`/blog/${otherPost.slug}`}
                  className="block p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-bold text-foreground mb-2">{otherPost.title}</h4>
                  <p className="text-foreground/70 text-sm">{otherPost.excerpt}</p>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}