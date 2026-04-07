"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Menu, LayoutGrid, Play, Plus, LogOut } from "lucide-react";
import { cn } from "@repo/ui";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@repo/ui";
import { useUIStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from "@repo/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { label: "Dashboard", href: "/instructor", icon: LayoutGrid },
  { label: "My Courses", href: "/courses", icon: Play },

];

export function InstructorHeader() {
  const pathname = usePathname();
  const { profile, setProfile } = useUIStore();
  const [loading, setLoading] = useState(!profile);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (!profile) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileData) {
          setProfile({ ...profileData, email: user.email });
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase, profile, setProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };



  return (
    <header className="sticky top-0 z-20 h-20 bg-white/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 md:px-8 gap-4 md:gap-8 shrink-0">
      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            }
          />
          <DialogContent className="fixed inset-y-0 left-0 translate-x-0 translate-y-0 h-full w-[280px] rounded-none border-r border-border gap-0 p-0 sm:max-w-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left duration-300">
            <DialogHeader className="p-6 border-b border-border">
              <DialogTitle className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center p-1 shrink-0 shadow-sm">
                  <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xl tracking-tighter text-[#1A1A1A]">EDUVORA</span>
                  <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase leading-none">Instructor Architecture</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} strokeWidth={2.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-6">
                <Button asChild className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold gap-2">
                  <Link href="/courses/create" onClick={() => setIsMobileMenuOpen(false)}>
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    Create Course
                  </Link>
                </Button>
              </div>
            </nav>
            <div className="p-4 border-t border-border mt-auto space-y-1">
              <p className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-2">Instructor</p>
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="font-bold bg-primary text-white">{profile?.full_name?.[0]}</AvatarFallback>
                  <AvatarImage src={profile?.avatar_url || ""} />
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-foreground leading-none">{profile?.full_name}</span>
                  <span className="text-[10px] font-medium text-muted-foreground mt-1">Instructor Account</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium text-red-500 hover:bg-red-50 transition-all duration-200 text-left"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" strokeWidth={2.5} />
                <span>Sign Out</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Title + Instructor Side label */}
      <div className="hidden md:flex items-center gap-4">
        <Link href="/instructor" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center p-1 shrink-0 shadow-sm">
            <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-lg tracking-tighter text-[#1A1A1A]">EDUVORA</span>
            <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase leading-none">Instructor Side</span>
          </div>
        </Link>
      </div>

      {/* User Profile Info */}
      <div className="hidden lg:flex items-center gap-3 ml-auto">
        <div className="flex flex-col text-right">
          <span className="text-[14px] font-bold text-foreground leading-none">{profile?.full_name || "Instructor"}</span>
          <span className="text-[11px] font-medium text-muted-foreground mt-1">{profile?.email || "Instructor Account"}</span>
        </div>
      </div>
    </header>
  );
}
