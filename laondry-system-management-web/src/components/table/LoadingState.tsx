"use client";

import { motion } from "framer-motion";

import { cn } from "../../lib/utility";

export default function LoadingState({
  text = "Memuat",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-14",
        "text-foreground/70",
        className
      )}
    >
      <motion.div
        className="h-10 w-10 rounded-lg bg-current"
        animate={{ rotateY: [0, 180, 360], rotateX: [0, 180, 360] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
      />

      <div className="flex items-center gap-1">
        <p className="text-foreground text-base font-semibold">{text}</p>
        <div className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-current"
              initial={{ opacity: 0.25, y: 0 }}
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
