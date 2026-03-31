"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui";
import { 
  LayoutGrid, 
  Play, 
  Settings, 
  HelpCircle, 
  LogOut,
  Plus,
  MessageSquare
} from "lucide-react";
import { Button } from "@repo/ui";

const mainNavItems = [
  { label: "Dashboard", href: "/instructor", icon: LayoutGrid },
  { label: "My Courses", href: "/courses", icon: Play },
  { label: "Discussions", href: "/discussions", icon: MessageSquare },
  { label: "Settings", href: "/instructor-settings", icon: Settings },
];

const footerNavItems = [
  { label: "Help Center", href: "mailto:lalitsai7832@gmail.com", icon: HelpCircle },
  { label: "Logout", href: "/", icon: LogOut },
];

export function InstructorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border min-h-screen shrink-0 relative">
      {/* Branding */}
      <div className="p-8 pb-10">
        <Link href="/" className="flex items-center gap-4 transition-transform active:scale-[0.98]">
          <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tighter text-[#1A1A1A]">EDUVORA</span>
            <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase leading-none">Learning Architecture</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              id={`instructor-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", isActive ? "text-white" : "group-hover:text-primary")} strokeWidth={2.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Action Button */}
      <div className="px-4 py-6 border-y border-border/50 my-6">
        <Button asChild className="w-full py-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 font-bold text-[14px]" id="create-course-btn">
          <Link href="/courses/create">
            <Plus className="h-5 w-5" strokeWidth={3} />
            Create New Course
          </Link>
        </Button>
      </div>

      {/* Footer Navigation */}
      <div className="px-4 pb-8 space-y-1">
        {footerNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2.5} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
