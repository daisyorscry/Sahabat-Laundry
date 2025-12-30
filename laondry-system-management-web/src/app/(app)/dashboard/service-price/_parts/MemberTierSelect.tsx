"use client";

import * as React from "react";

import Dropdown, { type Option } from "@/components/partials/Dropdown";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

const OPTIONS: Option<string>[] = [
  { value: "", label: "Semua" },
  { value: "null", label: "Tanpa Tier (NULL)" },
  { value: "BRONZE", label: "Bronze" },
  { value: "SILVER", label: "Silver" },
  { value: "GOLD", label: "Gold" },
  { value: "PLATINUM", label: "Platinum" },
];

export default function MemberTierSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Semua",
}: Props) {
  return (
    <Dropdown<string>
      value={value}
      onChange={(v) => onChange(v)}
      options={OPTIONS}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      searchable={false}
      noOptionsText="Tidak ada tier"
    />
  );
}
