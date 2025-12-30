// src/components/ui/Checkbox.tsx
"use client";

import * as React from "react";

export type CheckboxProps = {
  id?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;

  label?: React.ReactNode;
  description?: React.ReactNode;

  size?: "sm" | "md";
  className?: string;
};

const sizeMap = {
  sm: {
    box: "h-4 w-4",
    icon: "h-3 w-3",
    gap: "gap-2",
    text: "text-[13px]",
    desc: "text-[11px]",
    pad: "px-1 py-1",
  },
  md: {
    box: "h-5 w-5",
    icon: "h-3.5 w-3.5",
    gap: "gap-2.5",
    text: "text-sm",
    desc: "text-xs",
    pad: "px-1 py-1.5",
  },
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      value,
      checked,
      defaultChecked,
      onChange,
      disabled,
      indeterminate = false,
      label,
      description,
      size = "md",
      className,
    },
    ref
  ) => {
    const s = sizeMap[size];
    const inputRef = React.useRef<HTMLInputElement>(null);

    // set indeterminate ke native input
    React.useEffect(() => {
      if (!inputRef.current) return;
      inputRef.current.indeterminate = Boolean(indeterminate && !checked);
    }, [indeterminate, checked]);

    const mergedRef = React.useCallback(
      (node: HTMLInputElement) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    return (
      <label
        className={[
          "inline-flex w-fit items-start rounded-md select-none",
          s.gap,
          s.pad,
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          // hover background yang subtle
          disabled ? "" : "hover:bg-background/60",
          className ?? "",
        ].join(" ")}
      >
        {/* Native input */}
        <input
          ref={mergedRef}
          id={id}
          name={name}
          value={value}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.currentTarget.checked)}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-disabled={disabled || undefined}
        />

        {/* Kotak visual */}
        <span
          className={[
            "relative inline-flex shrink-0 items-center justify-center rounded",
            "bg-surface border transition-all",
            "border-[color:var(--border)]",
            s.box,
            // focus ring
            "peer-focus-visible:ring-2 peer-focus-visible:outline-none",
            // hover/active border highlight saat bisa diinteraksi
            disabled ? "" : "peer-hover:border-brand-400 peer-active:scale-[0.98]",
            // checked colors
            "peer-checked:bg-brand-500 peer-checked:border-brand-500",
            // smooth shadow feel
            "shadow-sm/5",
          ].join(" ")}
          // pakai token ring-color dari theme-mu
          style={{ boxShadow: "0 0 0 0 var(--ring-color)" }}
          aria-hidden="true"
        >
          {/* Icon check/minus dengan animasi */}
          <svg
            viewBox="0 0 20 20"
            className={[
              "absolute text-white transition-all duration-150 ease-out",
              // default icon hidden
              "scale-90 opacity-0",
              // tampil saat checked ATAU indeterminate
              (indeterminate && !checked) || checked ? "scale-100 opacity-100" : "",
              s.icon,
            ].join(" ")}
          >
            {indeterminate && !checked ? (
              <rect x="4" y="9" width="12" height="2" rx="1" fill="currentColor" />
            ) : (
              <path d="M7.5 11.5l-2-2L4 11l3.5 3.5L16 6.9l-1.6-1.6L7.5 11.5z" fill="currentColor" />
            )}
          </svg>
        </span>

        {/* Label + description */}
        {(label || description) && (
          <span className="flex min-w-0 flex-col">
            {label && <span className={`text-foreground/90 leading-tight ${s.text}`}>{label}</span>}
            {description && (
              <span className={`text-foreground/60 leading-snug ${s.desc}`}>{description}</span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
