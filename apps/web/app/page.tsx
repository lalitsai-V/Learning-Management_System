"use client";

import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CuratedSelections } from "@/components/curated-selections";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-950 flex flex-col items-center">
      <Navbar />

      {/* Centering Wrapper */}
      <div className="w-full flex-1">
        <div className="relative">
          <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-indigo-50/50 via-white to-transparent pointer-events-none" />
          <Hero />
        </div>

        <CuratedSelections />
      </div>

      <Footer />
    </main>
  );
}
