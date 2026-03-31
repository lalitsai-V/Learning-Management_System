"use client";

import { Search, HelpCircle, ArrowRight, Mail, Play, Shield } from "lucide-react";
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
         <div className="flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-2 border-dashed border-border hover:border-indigo-400/40 transition-all hover:bg-indigo-50 group max-w-2xl mx-auto text-center gap-6">
            <div className="h-16 w-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
               <Mail className="h-7 w-7" />
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl font-bold tracking-tighter leading-tight">Mastery Support</h3>
               <p className="text-[16px] font-medium text-muted-foreground leading-relaxed">
                  For any queries or assistance, please reach out to our support team directly via email.
               </p>
            </div>
            <a href="mailto:lalitsai783@gmail.com">
               <Button className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20">
                  lalitsai783@gmail.com
               </Button>
            </a>
         </div>
      </div>
   );
}
