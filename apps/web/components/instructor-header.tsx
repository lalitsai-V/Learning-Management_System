"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bell, User, Heart, Clock, UserPlus, Menu, X, LayoutGrid, Play, MessageSquare, Settings, Plus, LogOut } from "lucide-react";
import { cn } from "@repo/ui";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@repo/ui";
import { useUIStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from "@repo/ui";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { label: "Dashboard", href: "/instructor", icon: LayoutGrid },
  { label: "My Courses", href: "/courses", icon: Play },
  { label: "Discussions", href: "/discussions", icon: MessageSquare },
  { label: "Settings", href: "/instructor-settings", icon: Settings },
];

export function InstructorHeader() {
  const pathname = usePathname();
  const { profile, setProfile } = useUIStore();
  const [loading, setLoading] = useState(!profile);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!profile) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(profileData);
    }
    
    // Fetch wishlist notifications for this instructor's courses
    const { data: wishlistData } = await supabase
      .from("wishlist")
      .select(`
        id,
        created_at,
        course:courses(title),
        student:profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch enrollment notifications for this instructor's courses
    const { data: enrollmentData } = await supabase
      .from("enrollments")
      .select(`
        id,
        enrolled_at,
        course:courses(title),
        student:profiles(full_name)
      `)
      .order('enrolled_at', { ascending: false })
      .limit(5);
      
    const combined = [
      ...(wishlistData || []).map(w => ({ ...w, type: 'wishlist' as const })),
      ...(enrollmentData || []).map(e => ({ 
        ...e, 
        type: 'enrollment' as const, 
        created_at: e.enrolled_at 
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setNotifications(combined);
    // Only set unread if it's currently false and we actually have notifications
    if (combined.length > 0) {
      setHasUnread(true);
    }
    setLoading(false);
  }, [supabase, profile, setProfile]);

  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('instructor-notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishlist' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'enrollments' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleNotificationClick = () => {
    setHasUnread(false);
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

      {/* Title (Hidden on mobile) */}
      <div className="flex-1 hidden md:block">
        <h1 className="text-[18px] font-bold text-foreground tracking-tight">Instructor Overview</h1>
      </div>
      
      {/* Small Title (Mobile only) */}
      <div className="md:hidden flex-1 flex justify-center">
        <Link href="/instructor" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
          </div>
          <span className="font-bold text-[20px] tracking-tighter text-[#1A1A1A] leading-none">EDUVORA</span>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 md:gap-6">
        <DropdownMenu onOpenChange={(open) => open && handleNotificationClick()}>
          <DropdownMenuTrigger className="p-2 md:p-2.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative">
            <Bell className="h-5 w-5" strokeWidth={2.5} />
            {hasUnread && (
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full border border-white" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl border-zinc-100 shadow-xl overflow-hidden">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-4 flex items-center justify-between">
                <span className="text-[13px] font-black tracking-tight">Notifications</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                  {notifications.length} New
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mx-1 bg-zinc-50" />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="p-3 rounded-xl cursor-default flex flex-col items-start gap-1 focus:bg-zinc-50">
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        notif.type === 'wishlist' ? "bg-pink-50" : "bg-blue-50"
                      )}>
                        {notif.type === 'wishlist' ? (
                          <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                        ) : (
                          <UserPlus className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-foreground leading-tight">
                          <span className="text-primary">{notif.student?.full_name}</span> {notif.type === 'wishlist' ? 'wishlisted your course' : 'enrolled in your course'}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                          {notif.course?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 pl-11 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto">
                    <Bell className="h-6 w-6 text-zinc-300" />
                  </div>
                  <p className="text-[12px] font-bold text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-4 md:pl-6 md:border-l md:border-border/50">
          <div className="hidden md:flex flex-col items-end text-right">
            {loading ? (
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <span className="text-[14px] font-bold text-foreground leading-none">
                  {profile?.full_name || "User"}
                </span>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider mt-1">
                  {profile?.role || "Instructor"}
                </span>
              </>
            )}
          </div>
          <Avatar className="h-9 w-9 md:h-10 md:w-10 border-2 border-muted shadow-sm">
            <AvatarFallback>{(profile?.full_name || "U")[0]}</AvatarFallback>
            <AvatarImage src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id || 'default'}`} />
          </Avatar>
        </div>
      </div>
    </header>
  );
}
