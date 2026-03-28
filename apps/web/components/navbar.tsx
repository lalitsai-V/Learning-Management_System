"use client";

import Link from "next/link";
import { Search, Bell, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@repo/ui";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useUIStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@repo/ui";

interface NavbarProps {
  isMinimal?: boolean;
}

export function Navbar({ isMinimal = false }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useUIStore();

  const isHome = pathname === "/";

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="w-full bg-white px-8 py-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-3 group shrink-0 transition-transform active:scale-[0.98]">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-primary/5 flex items-center justify-center p-1.5 group-hover:bg-primary/10 transition-colors shadow-sm">
            <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="text-[20px] font-black tracking-[-0.04em] leading-none mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>EDUVORA</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Learning Architecture</span>
          </div>
        </Link>

        {!isMinimal && (
          <div className="hidden lg:flex items-center gap-8">
            <button className="text-[13px] font-bold text-zinc-400 hover:text-foreground transition-colors flex items-center gap-1">
              Browse <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
            {user && !isHome && (
              <Link href="/dashboard" className="text-[13px] font-bold text-zinc-400 hover:text-foreground transition-colors">My Learning</Link>
            )}
            {user?.user_metadata?.role === 'instructor' && !isHome && (
              <Link href="/instructor" className="text-[13px] font-bold text-zinc-400 hover:text-foreground transition-colors">Instructor</Link>
            )}
          </div>
        )}
      </div>

      {!isMinimal && (
        <div className="flex-1 max-w-xl px-12 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search our catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-8 pr-4 text-[14px] font-semibold text-foreground placeholder:text-zinc-300 focus:ring-0 outline-none"
            />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-100 group-focus-within:bg-primary/20 transition-all" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {!isMinimal && !isHome && (
          <>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="h-6 w-px bg-zinc-100 mx-2" />
          </>
        )}

        {loading ? (
          <div className="h-10 w-24 bg-muted animate-pulse rounded-xl" />
        ) : user && !isHome ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="h-12 w-12 p-0 rounded-2xl bg-zinc-50 border border-zinc-100 relative group overflow-hidden flex items-center justify-center hover:bg-zinc-100 transition-colors">
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                <User className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors relative z-10" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl border-zinc-100 shadow-xl">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-[13px] font-black tracking-tight">{user.user_metadata?.full_name || 'My Account'}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="mx-1 bg-zinc-50" />
              <DropdownMenuItem className="p-0 rounded-xl cursor-pointer overflow-hidden">
                <Link href={user?.user_metadata?.role === 'instructor' ? '/instructor' : '/dashboard'} className="flex items-center gap-3 w-full h-full p-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[13px] font-bold">Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1 bg-zinc-50" />
              <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-xl cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50">
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-[13px] font-bold">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-[13px] font-bold text-zinc-500 hover:text-foreground">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-primary text-white rounded-xl px-8 h-12 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
              <Link href="/login">Join Now</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
