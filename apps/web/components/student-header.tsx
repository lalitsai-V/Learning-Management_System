"use client";

import { useUIStore } from "@/lib/store";
import { Search, Bell, ShoppingCart, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@repo/ui";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from "@repo/ui";
import { LayoutGrid, Play, Heart, CheckCircle, Settings, LogOut } from "lucide-react";

const navLinks = [
  { label: "Browse", href: "/explore" },
  { label: "My Learning", href: "/dashboard" },
  { label: "Completed", href: "/completed" },
];

const mobileNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Explore", href: "/explore", icon: Play },
  { label: "Completed", href: "/completed", icon: CheckCircle },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function StudentHeader() {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, profile, setProfile } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      if (profile) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    }
    loadProfile();
  }, [supabase, profile, setProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 h-20 bg-white/80 backdrop-blur-xl border-b border-border/50 flex items-center px-4 md:px-8 gap-4 md:gap-8 shrink-0">
      {/* Mobile Menu Trigger & Logo (Hidden when search is open) */}
      {!isSearchOpen && (
        <>
          <div className="lg:hidden">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                      <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase leading-none">Learning Architecture</span>
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
                        onClick={() => setIsOpen(false)}
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
                </nav>
                <div className="p-4 border-t border-border mt-auto space-y-1">
                   <p className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-2">Account</p>
                   <Link 
                    href="/settings" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                   >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] font-bold bg-primary text-white">{profile?.full_name?.[0]}</AvatarFallback>
                        <AvatarImage src={profile?.avatar_url || ""} />
                      </Avatar>
                      <span>My Profile</span>
                   </Link>
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

          <div className="lg:hidden flex-1 flex justify-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center p-1 shadow-sm">
                <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
              </div>
              <span className="font-bold text-xl tracking-tighter text-[#1A1A1A] leading-none">EDUVORA</span>
            </Link>
          </div>
        </>
      )}

      {/* Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[14px] font-semibold transition-colors duration-200 py-1 border-b-2",
                isActive 
                  ? "text-primary border-primary" 
                  : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Search Bar (Desktop) / Mobile expanded search */}
      <div className={cn(
        "flex-1 max-w-xl relative group",
        isSearchOpen ? "flex" : "hidden md:flex"
      )}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" strokeWidth={2.5} />
        <input
          id="student-search-bar"
          type="search"
          autoFocus={isSearchOpen}
          placeholder="Search courses..."
          defaultValue={searchQuery}
          onBlur={() => isSearchOpen && setIsSearchOpen(false)}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-12 pr-4 bg-[#F5F7FA] border-none rounded-xl text-[14px] font-medium placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
        {isSearchOpen && (
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)} className="ml-2 h-11 w-11 rounded-xl">
             <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Actions */}
      {!isSearchOpen && (
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="md:hidden h-10 w-10">
            <Search className="h-5 w-5" />
          </Button>
          <Link href="/settings" className="flex items-center gap-3 pl-2 border-l border-border/50 group">
            <Avatar className="h-10 w-10 border-2 border-muted transition-transform active:scale-95 group-hover:border-primary/50">
              <AvatarFallback className="text-sm font-black bg-zinc-100 text-zinc-400">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
              <AvatarImage src={profile?.avatar_url || undefined} alt="Student Avatar" className="object-cover" />
            </Avatar>
          </Link>
        </div>
      )}
    </header>
  );
}
