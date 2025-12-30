import React from "react";

import BigCTA from "./_components/BigCTA";
import BlogList from "./_components/BlogList";
import FAQ from "./_components/FAQ";
import Footer from "./_components/Footer";
import Navbar from "./_components/Navbar";
import Testimonials, { Testimonial } from "./_components/Testimonials";
import Hero from "./_components/Hero";
import ServicePricing from "./_components/ServicePricing";
import { Features } from "./_components/Feature";

export const metadata = {
  title: "Sahabat Laundry - Jasa Laundry Antar Jemput & Express Terbaik di Kendari",
  description:
    "Layanan laundry antar jemput cepat, bersih, dan higienis di Kendari. Express 24 jam, harga terjangkau, gratis ongkir. Proses kilat, hasil memuaskan!",
  openGraph: {
    title: "Sahabat Laundry - Jasa Laundry Antar Jemput & Express Terbaik di Kendari",
    description:
      "Layanan laundry antar jemput cepat, bersih, dan higienis. Proses kilat dalam 24 jam, harga terjangkau, gratis ongkir.",
    url: "https://sahabatlaundry.id",
    siteName: "Sahabat Laundry",
    images: [
      {
        url: "/og-image.jpg", // You might want to create an og image
        width: 1200,
        height: 630,
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  alternates: {
    canonical: "https://sahabatlaundry.id",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "laundry kendari",
    "antar jemput laundry",
    "laundry express",
    "cuci kilat kendari",
    "laundry online kendari",
    "jasa laundry",
  ],
  authors: [{ name: "Sahabat Laundry" }],
  creator: "Sahabat Laundry",
  publisher: "Sahabat Laundry",
};

export const dynamic = "force-static";

export default function Page() {
  const reviews: Testimonial[] = [
    { name: "Dina", text: "Cepat dan wangi. Pickup-nya tepat waktu." },
    { name: "Agus", text: "Harga jelas, hasil rapi. Recomended." },
    { name: "Lia", text: "Express 24 jam bantu banget saat darurat." },
    { name: "Budi", text: "Pelayanan profesional, pakaian jadi wangi dan lembut." },
    { name: "Siti", text: "Hemat waktu, kurirnya ramah dan jadwal fleksibel." },
    { name: "Ahmad", text: "Laundry terbaik yang pernah saya coba!" },
  ];

  return (
    <>
      <Navbar />
      <main>
        <Hero/>
        <Features/>
        <ServicePricing />
        <BlogList />
        <FAQ />
        <Testimonials items={reviews} />
        <BigCTA />
      </main>
      <Footer />
    </>
  );
}
