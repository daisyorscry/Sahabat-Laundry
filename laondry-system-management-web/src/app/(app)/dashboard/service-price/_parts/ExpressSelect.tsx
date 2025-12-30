"use client";

import * as React from "react";

import Dropdown, { type Option } from "@/components/partials/Dropdown";

type ExpressValue = "" | "true" | "false";

type Props = {
  value: ExpressValue;
  onChange: (v: ExpressValue) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

const OPTIONS: Option<ExpressValue>[] = [
  { value: "", label: "Semua" },
  { value: "true", label: "Ya" },
  { value: "false", label: "Tidak" },
];

export default function ExpressSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Semua",
}: Props) {
  return (
    <Dropdown<ExpressValue>
      value={value}
      onChange={(v) => onChange(v as ExpressValue)}
      options={OPTIONS}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      searchable={false}
      noOptionsText="Tidak ada opsi"
    />
  );
}
