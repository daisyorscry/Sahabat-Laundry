"use client";

import { PropsWithChildren, useCallback, useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="min-h-dvh">
      <Sidebar open={open} onClose={close} />
      <div className="flex min-h-dvh flex-col lg:pl-72">
        <Header onToggleSidebar={toggle} />
        {children}
      </div>
    </div>
  );
}
