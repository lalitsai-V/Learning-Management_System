"use client";

import Link from "next/link";
import { Button } from "@repo/ui";
import { ArrowRight } from "lucide-react";

export function Hero() {
   return (
      <section className="relative pt-24 pb-32 px-10 max-w-7xl mx-auto overflow-hidden" id="hero-section">
         <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10 text-center lg:text-left">
               <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-full px-6 py-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                     Editorial Learning Architecture
                  </span>
               </div>

               <div className="space-y-6">
                  <h1 className="text-6xl lg:text-8xl font-black tracking-[-0.04em] text-foreground leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                     Learn Beyond <br />
                     <span className="text-primary italic">Limitations.</span>
                  </h1>
                  <p className="text-[17px] font-semibold text-muted-foreground/80 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                     Experience high-fidelity course design by industry titans, wrapped in an editorial interface that prioritizes focus and aesthetic clarity.
                  </p>
               </div>

               <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <Button asChild id="hero-join-btn" size="lg" className="bg-primary text-white rounded-2xl px-10 py-8 font-bold text-[16px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all group">
                     <Link href="/login">
                        Launch Learning
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </Button>
                  <Button asChild id="hero-how-it-works-btn" size="lg" variant="ghost" className="text-[16px] font-bold text-muted-foreground hover:text-foreground">
                     <Link href="/login">See how it works</Link>
                  </Button>
               </div>


            </div>
         </div>
      </section>
   );
}
