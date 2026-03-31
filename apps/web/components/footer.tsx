"use client";

import Link from "next/link";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Platform",
    links: [
      { label: "Browse Courses", href: "#" },
      { label: "Eduvora for Business", href: "#" },
      { label: "Mobile Apps", href: "#" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    title: "Instructor",
    links: [
      { label: "Teach on Eduvora", href: "#" },
      { label: "Partner Program", href: "#" },
      { label: "Resource Center", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Settings", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="pt-32 pb-16 px-6 max-w-7xl mx-auto border-t border-slate-50">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-20">
        <div className="col-span-2 space-y-8">
          <Link href="/" className="flex items-center gap-4 text-xl font-black tracking-tight text-zinc-950 group">
            <div className="h-14 w-14 rounded-[1.25rem] bg-primary/5 flex items-center justify-center p-1.5 group-hover:bg-primary/10 transition-colors shadow-sm">
              <img src="/logo.png" alt="Eduvora Logo" className="h-full w-full object-contain scale-110" />
            </div>
            <span><span className="text-indigo-600 transition-colors group-hover:text-indigo-700">Eduvora</span> Learning</span>
          </Link>
          <p className="text-zinc-600 max-w-xs font-medium leading-relaxed">
            Elevating digital education through premium editorial design and world-class instruction.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:-translate-y-1">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:-translate-y-1">
              <Instagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:-translate-y-1">
              <Github className="h-5 w-5" />
            </Link>
            <Link href="#" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all hover:-translate-y-1">
              <Linkedin className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {FOOTER_LINKS.map((column) => (
          <div key={column.title} className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {column.title}
            </h4>
            <ul className="space-y-4">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

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
