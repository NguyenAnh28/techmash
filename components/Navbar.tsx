"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Vote" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/blog", label: "Notes" },
  { href: "/stats", label: "Platform" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full pointer-events-none">
      <div className="mx-auto flex h-20 w-full max-w-[calc(100vw-1rem)] items-center justify-between gap-2 px-2 sm:h-24 sm:max-w-6xl sm:gap-4 sm:px-6">
        <div className="pointer-events-auto flex h-14 w-full min-w-0 items-center justify-between gap-1 rounded-xl border border-black/[0.05] bg-white/70 p-1.5 text-black shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl backdrop-saturate-150 sm:contents">
          <Link
            href="/"
            className="group flex h-11 shrink-0 items-center gap-1 rounded-lg pr-1 text-black sm:pointer-events-auto sm:h-14 sm:gap-3 sm:rounded-xl sm:border sm:border-black/[0.05] sm:bg-white/70 sm:px-3 sm:shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:backdrop-blur-xl sm:backdrop-saturate-150"
          >
            <Image
              src="/internmash-logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="size-7 sm:size-10"
            />
            <span className="hidden sm:inline">
              <span className="block text-base font-medium tracking-[-0.02em] sm:text-2xl sm:tracking-[-0.045em]">
                InternMash
              </span>
            </span>
          </Link>

          <nav className="flex h-11 min-w-0 flex-1 items-center justify-center gap-0.5 rounded-lg text-[0.56rem] font-semibold uppercase tracking-[0.02em] sm:pointer-events-auto sm:h-14 sm:flex-none sm:gap-1 sm:rounded-xl sm:border sm:border-black/[0.05] sm:bg-white/70 sm:p-1 sm:text-sm sm:font-medium sm:tracking-[0.08em] sm:shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:backdrop-blur-xl sm:backdrop-saturate-150">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-lg px-1 transition-all duration-200 sm:h-12 sm:flex-none sm:px-5",
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
      </div>
    </header>
  );
}
