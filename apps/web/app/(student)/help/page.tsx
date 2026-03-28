"use client";

import { Search, HelpCircle, ArrowRight, MessageSquare, Mail, Play, Shield } from "lucide-react";
import { Button } from "@repo/ui";

const FAQ_CATEGORIES = [
  { id: "getting-started", label: "Foundations", icon: Play, desc: "Quickly master the interface." },
  { id: "account", label: "Ecosystem Control", icon: Shield, desc: "Manage your core identity." },
  { id: "billing", label: "Subscription", icon: HelpCircle, desc: "Manage payments and tiers." },
];

export default function HelpCenterPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20 px-4">
      {/* Search Header */}
      <div className="relative h-[400px] rounded-[3.5rem] bg-slate-950 flex flex-col items-center justify-center text-center px-10 overflow-hidden shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 to-transparent pointer-events-none" />
         <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
         
         <div className="relative z-10 space-y-8 max-w-2xl w-full">
            <div className="space-y-4">
               <span className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.4em] leading-none mb-2 block">Support Gateway</span>
               <h1 className="text-6xl font-black text-white tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>How can we assist your mastery?</h1>
            </div>
            
            <div className="relative w-full group">
               <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40 transition-colors group-focus-within:text-white" strokeWidth={3} />
               <input 
                 id="help-search-input"
                 type="search" 
                 placeholder="Search our high-fidelity repository..." 
                 className="w-full h-20 pl-18 pr-44 rounded-3xl bg-white/5 border-2 border-white/10 text-white text-[17px] font-bold placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all backdrop-blur-md"
               />
               <Button className="absolute right-3 top-3 bottom-3 rounded-2xl bg-white text-slate-950 font-black px-10 hover:bg-slate-100 transition-all shadow-xl">
                 Search Repository
               </Button>
            </div>
         </div>
      </div>

      {/* Grid Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.id} className="card-premium p-10 bg-white border-none shadow-premium hover:shadow-hover transition-all duration-300 cursor-pointer group">
               <div className="h-16 w-16 rounded-[2rem] bg-[#F5F7FA] text-primary flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                  <cat.icon className="h-7 w-7" strokeWidth={2.5} />
               </div>
               <h3 className="text-2xl font-bold tracking-tight mb-3">{cat.label}</h3>
               <p className="text-[14px] text-muted-foreground font-medium leading-relaxed">{cat.desc}</p>
               <div className="mt-8 flex items-center gap-2 text-primary text-[13px] font-black uppercase tracking-widest hover:gap-4 transition-all">
                  Browse Chapters <ArrowRight className="h-4 w-4" strokeWidth={3} />
               </div>
            </div>
         ))}
      </div>

      {/* Direct Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <div className="p-12 rounded-[3.5rem] border-2 border-dashed border-border flex flex-col items-start gap-8 hover:border-primary/40 transition-all hover:bg-primary/5 group">
            <div className="h-16 w-16 rounded-[2rem] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:rotate-12 transition-all">
               <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-3">
               <h3 className="text-3xl font-bold tracking-tighter leading-tight">Live Concierge</h3>
               <p className="text-[15px] font-medium text-muted-foreground leading-relaxed max-w-sm">Connect with our learning architects in real-time for immediate precision.</p>
            </div>
            <Button className="h-14 px-10 rounded-2xl bg-foreground text-white font-bold text-[14px] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10">Start Dialogue</Button>
         </div>

         <div className="p-12 rounded-[3.5rem] border-2 border-dashed border-border flex flex-col items-start gap-8 hover:border-indigo-400/40 transition-all hover:bg-indigo-50 group">
            <div className="h-16 w-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group-hover:-rotate-12 transition-all">
               <Mail className="h-7 w-7" />
            </div>
            <div className="space-y-3">
               <h3 className="text-3xl font-bold tracking-tighter leading-tight">Mastery Support</h3>
               <p className="text-[15px] font-medium text-muted-foreground leading-relaxed max-w-sm">Submit your inquiries via the traditional pathway for a deep-dive response.</p>
            </div>
            <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-bold text-[14px] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20">Email Us</Button>
         </div>
      </div>
    </div>
  );
}
