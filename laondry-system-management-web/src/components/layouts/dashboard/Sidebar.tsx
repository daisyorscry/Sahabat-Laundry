"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  HiChevronRight,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineCog,
  HiOutlineCollection,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlinePuzzle,
  HiOutlineTag,
  HiOutlineUserGroup,
} from "react-icons/hi";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname() || "";

  const inServices =
    pathname.startsWith("/dashboard/services") ||
    pathname.startsWith("/dashboard/service-categories") ||
    pathname.startsWith("/dashboard/addons");

  const [openServices, setOpenServices] = React.useState(inServices);

  React.useEffect(() => {
    setOpenServices(inServices);
  }, [inServices]);

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-72",
          "bg-background border-border border-r",
          "transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        aria-label="Sidebar"
      >
        {/* Header */}
        <div className="border-border flex h-16 items-center gap-2 border-b px-4">
          <div className="h-8 w-8 rounded bg-[oklch(20%_0.02_260)] dark:bg-[oklch(92%_0.01_260)]" />
          <div className="text-foreground font-semibold">Laundry Admin</div>
        </div>

        {/* Nav */}
        <nav className="space-y-1 p-3">
          <NavLink href="/dashboard" label="Overview" icon={HiOutlineHome} onClick={onClose} />
          <NavLink
            href="/dashboard/outlets"
            label="Outlets"
            icon={HiOutlineOfficeBuilding}
            onClick={onClose}
          />
          <NavLink
            href="/dashboard/orders"
            label="Orders"
            icon={HiOutlineClipboardList}
            onClick={onClose}
          />

          {/* Group: Services */}
          <button
            type="button"
            className={clsx(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "text-foreground",
              "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
              openServices ? "bg-card-primary" : "hover:bg-card-primary/80"
            )}
            aria-expanded={openServices}
            aria-controls="nav-services"
            onClick={() => setOpenServices((s) => !s)}
          >
            <HiOutlineCollection className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Services</span>
            <HiChevronRight
              className={clsx(
                "h-4 w-4 transition-transform",
                openServices ? "rotate-90" : "rotate-0"
              )}
              aria-hidden
            />
          </button>

          {/* Children Services */}
          <div id="nav-services" hidden={!openServices} className="space-y-1 pr-3 pl-9">
            <NavLink
              href="/dashboard/service-categories"
              label="Service Categories"
              icon={HiOutlineTag}
              size="sm"
              onClick={onClose}
            />
            <NavLink
              href="/dashboard/addons"
              label="Addons"
              icon={HiOutlinePuzzle}
              size="sm"
              onClick={onClose}
            />
            <NavLink
              href="/dashboard/services"
              label="Services"
              icon={HiOutlineCollection}
              size="sm"
              onClick={onClose}
            />
          </div>

          <NavLink
            href="/dashboard/service-price"
            label="Pricing"
            icon={HiOutlineTag}
            onClick={onClose}
          />
          <NavLink
            href="/dashboard/customers"
            label="Customers"
            icon={HiOutlineUserGroup}
            onClick={onClose}
          />
          <NavLink
            href="/dashboard/reports"
            label="Reports"
            icon={HiOutlineChartBar}
            onClick={onClose}
          />
          <NavLink
            href="/dashboard/settings"
            label="Settings"
            icon={HiOutlineCog}
            onClick={onClose}
          />
        </nav>


      </aside>
    </>
  );
}

function NavLink(props: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  size?: "md" | "sm";
}) {
  const { href, label, icon: Icon, onClick, size = "md" } = props;
  const pathname = usePathname() || "";

  const segs = href.split("/").filter(Boolean);
  const isRootMenu = segs.length === 1;

  const active = isRootMenu
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-md transition-colors",
        "text-foreground",
        "focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
        active
          ? "bg-[color-mix(in_oklab,var(--color-foreground)_10%,var(--color-background))]"
          : "hover:bg-[color-mix(in_oklab,var(--color-foreground)_6%,var(--color-background))]",
        size === "sm" ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-sm"
      )}
      style={{ outline: "none" }}
    >
      <Icon className={clsx("shrink-0", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
