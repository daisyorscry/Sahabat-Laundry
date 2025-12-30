"use client";

import clsx from "clsx";
import * as React from "react";

type HeaderBarProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function HeaderBar({ title, description, actions, className }: HeaderBarProps) {
  return (
    <div
      className={clsx(
        "mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
