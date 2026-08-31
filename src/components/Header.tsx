"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Car, LayoutDashboard, Settings, Bus } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/", label: "จองรถ", icon: Calendar },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "จัดการรถ", icon: Car },
  { href: "/admin/bookings", label: "การจอง", icon: Bus },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-school-green text-white">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              CarFlow
            </h1>
            <p className="text-xs text-slate-500">
              โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href) && href !== "/";
            const showOnMobile = href === "/" || isAdmin;

            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  !showOnMobile && href !== "/" && "hidden sm:flex",
                  href === "/" && "flex"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
