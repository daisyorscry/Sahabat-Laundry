"use client";

import * as React from "react";
import clsx from "clsx";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={clsx(
          "block w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none",
          "bg-background text-foreground border-border",
          "focus:border-primary focus:ring-primary/40 focus:ring-2",
          invalid && "border-danger focus:border-danger focus:ring-danger/40",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
