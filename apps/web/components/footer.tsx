"use client";

import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";


export function Footer() {
  return (
    <footer >

      <div className="mt-32 pt-12 border-t border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          © 2026 Eduvora Learning Architecture. All rights reserved.
        </p>
        <div className="flex gap-8">
          <a href="mailto:lalitsai783@gmail.com" className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
            Contact Support
          </a>
          <Link href="#" className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">
            Help Center
          </Link>
        </div>
      </div>
    </footer>
  );
}
