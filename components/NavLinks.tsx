"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 text-sm flex-wrap">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "font-medium text-slate-900" : "text-slate-600 hover:text-slate-900"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
