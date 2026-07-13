"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/blog", label: "Notes" },
  { href: "/", label: "Vote" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/stats", label: "Platform" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full pointer-events-none">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link
          href="/"
          className="group pointer-events-auto flex h-14 items-center gap-3 rounded-xl border border-black/[0.05] bg-white/70 px-3 text-black shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl backdrop-saturate-150"
        >
          <Image
            src="/internmash-logo.png"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10"
          />
          <span>
            <span className="block text-2xl font-medium tracking-[-0.045em]">
              InternMash
            </span>
          </span>
        </Link>

        <nav className="pointer-events-auto flex h-14 items-center gap-1 rounded-xl border border-black/[0.05] bg-white/70 p-1 text-xs font-medium uppercase tracking-[0.08em] shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl backdrop-saturate-150 sm:text-sm">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex h-12 items-center rounded-lg px-3 transition-all duration-200 sm:px-5",
                  isActive
                    ? "border border-black/[0.04] bg-neutral-100 !text-black shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                    : "text-neutral-500 hover:bg-white/75 hover:text-black",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
