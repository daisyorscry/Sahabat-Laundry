"use client";

import * as React from "react";
import clsx from "clsx";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  markRequired?: boolean;
};

export default function Label({ className, children, markRequired, ...props }: LabelProps) {
  return (
    <label
      className={clsx("text-foreground mb-1 block text-sm font-medium", className)}
      {...props}
    >
      {children}
      {markRequired && <span className="ml-0.5 text-danger">*</span>}
    </label>
  );
}
