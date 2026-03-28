"use client";

import Link from "next/link";
import { Button } from "@repo/ui";
import Image from "next/image";
import { ArrowRight, Star, Users, Briefcase } from "lucide-react";

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
                 <Link href="/explore">
                    Launch Learning
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                 </Link>
              </Button>
              <Button asChild id="hero-how-it-works-btn" size="lg" variant="ghost" className="text-[16px] font-bold text-muted-foreground hover:text-foreground">
                 <Link href="/explore">See how it works</Link>
              </Button>
           </div>

           <div className="flex items-center justify-center lg:justify-start gap-12 pt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex flex-col">
                 <span className="text-3xl font-black tracking-tight tracking-[-0.04em]" style={{ fontFamily: 'Outfit, sans-serif' }}>120k+</span>
                 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active Minds</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-3xl font-black tracking-tight tracking-[-0.04em]" style={{ fontFamily: 'Outfit, sans-serif' }}>4.9/5</span>
                 <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Student Rating</span>
              </div>
           </div>
        </div>

        <div className="flex-1 relative animate-in fade-in slide-in-from-right-10 duration-1000">
          <div className="relative rounded-[3.5rem] overflow-hidden shadow-premium group">
             <Image 
                src="/hero_illustration_1774082222451.jpg" 
                alt="Expert-led education architecture" 
                width={800}
                height={600}
                className="object-cover group-hover:scale-110 transition-transform duration-1000"
             />
             <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl flex items-center gap-6">
                   <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Star className="h-6 w-6 fill-current" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Featured Review</p>
                      <p className="text-[14px] font-bold text-foreground leading-tight">"The most thoughtful learning platform I've used in a decade."</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="absolute top-10 -left-10 h-28 w-28 rounded-3xl bg-primary shadow-2xl flex items-center justify-center text-white -rotate-12 animate-bounce-slow">
             <Briefcase className="h-10 w-10" />
          </div>
          <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full border-2 border-primary/20 bg-white shadow-2xl flex items-center justify-center -rotate-6 animate-pulse">
             <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-primary mb-1" />
                <span className="text-[10px] font-bold text-primary tracking-widest">+420</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
