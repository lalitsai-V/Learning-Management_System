"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { ArrowLeft, BarChart2 } from "lucide-react";

export default function CourseAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-6 border-b border-border/50 pb-8 mt-4">
        <Button asChild variant="ghost" className="h-12 w-12 rounded-2xl p-0 hover:bg-zinc-100">
          <Link href="/courses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Course Management</span>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border-2 border-dashed border-border/60 bg-white">
        <div className="h-20 w-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mb-6">
          <BarChart2 className="h-10 w-10 text-amber-500" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">Analytics Coming Soon</h3>
        <p className="text-muted-foreground font-medium mb-8 max-w-sm">
          Detailed metrics, student engagement, and revenue tracking are being built right now.
        </p>
        <Button asChild className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold gap-2">
          <Link href="/courses">
            Back to Courses
          </Link>
        </Button>
      </div>
    </div>
  );
}
