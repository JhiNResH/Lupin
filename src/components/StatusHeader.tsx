"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Shield, Eye } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function StatusHeader() {
  const { login, authenticated, user, logout } = usePrivy();

  // Get user avatar from Privy (Google, etc.)
  const userAvatar =
    (user?.google as { picture?: string } | undefined)?.picture ||
    user?.twitter?.profilePictureUrl ||
    (user?.discord as { imageUrl?: string } | undefined)?.imageUrl ||
    null;

  const userDisplayName =
    user?.google?.name ||
    user?.twitter?.username ||
    user?.discord?.username ||
    user?.email?.address?.split("@")[0] ||
    "Agent";

  return (
    <header className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="size-10 flex items-center justify-center border border-[var(--primary)]/40 rounded-lg bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/20 transition-colors">
          <Eye className="text-[var(--primary)] w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-[0.2em] text-white uppercase">
          Lupin
        </h1>
      </Link>

      {/* Right Side */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Map Link */}
        <Link
          href="/map"
          className="flex items-center gap-2 px-3 md:px-4 py-2 border border-[var(--primary)]/30 rounded-lg bg-[var(--primary)]/5 hover:bg-[var(--primary)]/20 transition-all group"
        >
          <span className="text-[var(--primary)] text-lg">🗺️</span>
          <span className="hidden md:block text-xs font-bold tracking-widest uppercase text-[var(--primary)]">
            Forensic Map
          </span>
        </Link>

        {/* Protect My Data / Privacy Vault Button */}
        <button
          onClick={() => (authenticated ? logout() : login())}
          className="hidden md:flex items-center gap-3 px-5 py-2.5 border border-[var(--primary)]/30 rounded-lg bg-[var(--background-dark)]/80 hover:bg-[var(--primary)]/10 transition-all group border-l-4 border-l-[var(--primary)]"
        >
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-[var(--primary)]/60">
              {authenticated ? "Privacy Vault" : "Get Protected"}
            </span>
            <div className="flex items-center gap-2">
              <Shield className="text-[var(--primary)] w-4 h-4" />
              <span className="text-xs font-bold tracking-widest uppercase text-[var(--slate-silver)] group-hover:text-[var(--primary)] transition-colors">
                {authenticated ? "Protected" : "Protect My Data"}
              </span>
            </div>
          </div>
        </button>

        {/* User Avatar */}
        {authenticated && userAvatar ? (
          <div className="relative group">
            <Image
              src={userAvatar}
              alt={userDisplayName}
              width={40}
              height={40}
              className="rounded-lg border border-[var(--primary)]/30 shadow-[0_0_10px_rgba(0,255,255,0.1)] object-cover"
            />
            <div className="absolute -bottom-1 -right-1 size-3 bg-[var(--cyber-green)] rounded-full border-2 border-[var(--background-dark)] animate-pulse" />
          </div>
        ) : authenticated ? (
          <div className="size-10 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 flex items-center justify-center">
            <span className="text-[var(--primary)] text-sm font-bold">
              {userDisplayName.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
