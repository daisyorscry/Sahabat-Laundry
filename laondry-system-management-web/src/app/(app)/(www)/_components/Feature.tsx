"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { FaCheckCircle, FaClock, FaMoneyBillWave, FaShieldAlt, FaStar } from "react-icons/fa";
import { TbDeviceAnalytics } from "react-icons/tb";

import { cn } from "@/lib/utility";


const content = [
  {
    title: "Kenapa Memilih Kami",
    desc: "Berbagai keunggulan yang dirancang untuk pengalaman laundry tanpa repot.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <TbDeviceAnalytics className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Kenapa Memilih Kami</h3>
          <p className="text-lg">Pengalaman laundry tanpa repot dengan teknologi terkini</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Layanan profesional sejak 2019</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Lebih dari 10.000 pelanggan puas</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Jaminan kualitas dan keamanan</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Teknologi Tracking",
    desc: "Lacak status laundry Anda secara real-time melalui aplikasi atau website.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <TbDeviceAnalytics className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Teknologi Tracking</h3>
          <p className="text-lg">Aplikasi kami memberikan pembaruan real-time tentang status laundry Anda</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Notifikasi setiap tahap proses</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Estimasi waktu selesai akurat</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Riwayat pesanan lengkap</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Proses Kilat",
    desc: "Layanan express selesai dalam 24 jam. Cocok untuk kebutuhan mendesak.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <FaClock className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Proses Kilat</h3>
          <p className="text-lg">Layanan express yang menyelesaikan laundry dalam 24 jam</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Prioritas utama dalam antrian</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Selesai dalam waktu 24 jam</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Kualitas tetap terjaga</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Harga Terjangkau",
    desc: "Harga bersaing dengan kualitas terbaik. Tidak ada biaya tersembunyi.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <FaMoneyBillWave className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Harga Terjangkau</h3>
          <p className="text-lg">Kualitas premium dengan harga yang sangat kompetitif</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Harga bersaing di kelasnya</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Tidak ada biaya tersembunyi</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Paket hemat untuk pelanggan setia</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Bahan Aman",
    desc: "Menggunakan deterjen dan pelembut berkualitas tinggi yang aman untuk kulit.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-violet-500 to-purple-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <FaShieldAlt className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Bahan Aman</h3>
          <p className="text-lg">Deterjen dan pelembut berkualitas tinggi yang aman untuk kulit</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Bebas dari bahan kimia berbahaya</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Aman untuk kulit sensitif</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Tidak menyebabkan alergi</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Kualitas Terjamin",
    desc: "Proses pencucian terstandarisasi dengan peralatan modern dan higienis.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <FaCheckCircle className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Kualitas Terjamin</h3>
          <p className="text-lg">Proses pencucian standar tinggi dengan peralatan modern</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Standarisasi proses laundry</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Peralatan modern dan bersih</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Tim profesional berpengalaman</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Layanan Terbaik",
    desc: "Tim profesional dengan layanan pelanggan yang ramah dan responsif.",
    content: (
      <div className="flex flex-col h-full w-full justify-between p-8 bg-gradient-to-br from-sky-500 to-indigo-500 text-white rounded-md">
        <div className="flex items-center justify-center mb-6">
          <FaStar className="h-20 w-20" />
        </div>
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold">Layanan Terbaik</h3>
          <p className="text-lg">Tim profesional siap melayani Anda dengan sepenuh hati</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Customer service responsif 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Tim profesional berpengalaman</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-300" />
              <span>Kepuasan pelanggan prioritas utama</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

type Props = {
  active?: boolean;
};

export const Features = forwardRef<HTMLDivElement, Props>(({ active = false }, ref) => {
  const localRef = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  useEffect(() => {
    if (!localRef.current) return;
    if (active) {
      localRef.current.style.overflowY = "auto";
      localRef.current.style.height = "100vh";
      localRef.current.style.pointerEvents = "auto";
      localRef.current.focus();
    } else {
      localRef.current.style.overflowY = "hidden";
      localRef.current.style.pointerEvents = "none";
      localRef.current.style.height = "";
    }
  }, [active]);

  const [activeCard, setActiveCard] = React.useState(0);
  const { scrollYProgress } = useScroll({
    target: localRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const cardLength = content.length;
    const cardsBreakpoints = content.map((_, index) => index / cardLength);
    const closestBreakpointIndex = cardsBreakpoints.reduce((acc, breakpoint, index) => {
      const distance = Math.abs(latest - breakpoint);
      if (distance < Math.abs(latest - cardsBreakpoints[acc])) {
        return index;
      }
      return acc;
    }, 0);
    setActiveCard(closestBreakpointIndex);
  });

  return (
    <div className="w-full py-12">
      <div className="mx-auto max-w-6xl">
        <div className="relative flex">
          <div className="w-2/3 pr-6">
            <div ref={localRef} tabIndex={-1} className={cn("max-w-2xl outline-none")}>
              {content.map((item, index) => (
                <div key={item.title + index} className="my-0 h-screen">
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeCard === index ? 1 : 0.35 }}
                    className="text-2xl font-bold text-slate-100"
                  >
                    {item.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: activeCard === index ? 1 : 0.35 }}
                    className="text-kg mt-10 max-w-sm text-slate-300"
                  >
                    {item.desc}
                  </motion.p>
                </div>
              ))}
              <div className="h-40" />
            </div>
          </div>

          <div className="w-1/3">
            <div className="sticky top-10 hidden h-screen overflow-hidden rounded-md py-20 lg:block">
              {content[activeCard].content ?? null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Features.displayName = "Features";
