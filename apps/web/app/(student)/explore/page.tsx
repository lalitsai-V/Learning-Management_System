"use client";

import { useUIStore } from "@/lib/store";
import { CourseCard, CourseCardSkeleton } from "@/components/course-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui";
import { Search, Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";

const CATEGORIES = ["all", "Development", "Design", "Business", "Marketing", "Photography"];

export default function ExplorePage() {
  const { searchQuery, categoryFilter, setCategoryFilter } = useUIStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchCoursesAndWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles(full_name),
          enrollments:enrollments(count),
          modules:modules(count),
          course_ratings:course_ratings(rating)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      
    } catch (err: any) {
      console.error("Error fetching data:", err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCoursesAndWishlist();
  }, [fetchCoursesAndWishlist]);

  

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.instructor?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [searchQuery, categoryFilter, courses]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* Search & Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
           <div className="inline-flex items-center gap-2 bg-primary/5 rounded-full px-4 py-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Curated Catalog</span>
           </div>
           <h1 className="text-4xl lg:text-6xl font-black tracking-[-0.04em] leading-tight animate-in fade-in slide-in-from-left-6 duration-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Explore Our <br />
              <span className="text-primary italic">Architecture.</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-14 px-6 rounded-2xl border-border bg-white font-bold gap-2 hover:bg-zinc-50 transition-all">
              <SlidersHorizontal className="h-4 w-4" /> Filters
           </Button>
           <Button className="h-14 px-8 rounded-2xl bg-foreground text-white font-bold gap-2 shadow-lg shadow-black/10 hover:bg-zinc-800 transition-all">
              Browse All
           </Button>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="relative sticky top-20 z-10 py-6 -mx-4 px-4">
        <div className="absolute inset-x-0 top-0 bottom-0 bg-white/60 backdrop-blur-xl border-y border-zinc-100" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
           <Tabs
             value={categoryFilter}
             onValueChange={setCategoryFilter}
             className="w-full md:w-auto"
           >
             <TabsList className="bg-transparent h-auto p-0 flex md:flex-wrap gap-2 overflow-x-auto no-scrollbar pb-1">
               {CATEGORIES.map((cat) => (
                 <TabsTrigger
                   key={cat}
                   value={cat}
                   className="h-11 px-6 rounded-xl text-[13px] font-bold tracking-wide transition-all data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-zinc-50 shrink-0"
                 >
                   {cat === "all" ? "All Tracks" : cat}
                 </TabsTrigger>
               ))}
             </TabsList>
           </Tabs>
           
           <div className="flex items-center gap-2 text-[12px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap">
              <Filter className="h-3.5 w-3.5" />
              Viewing {filtered.length} Results
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 animate-in fade-in duration-500">
          {Array.from({ length: 8 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {filtered.map((course) => (
            <CourseCard 
              key={course.id} 
              id={course.id}
              title={course.title}
              author={course.instructor?.full_name || "Eduvora Architect"}
              category={course.category || "General"}
              rating={(() => {
                const ratings = course.course_ratings || [];
                if (ratings.length === 0) return 4.8;
                const sum = ratings.reduce((acc: any, r: any) => acc + (r.rating || 0), 0);
                return (sum / ratings.length);
              })()}
              students={(course.enrollments?.[0] as any)?.count || 0}
              modulesCount={(course.modules?.[0] as any)?.count || 0}
              thumbnail={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"}
              
            />
          ))}
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="h-24 w-24 rounded-[2rem] bg-zinc-50 flex items-center justify-center mb-8 border border-zinc-100 shadow-sm">
            <Search className="h-10 w-10 text-zinc-300" />
          </div>
          <div className="space-y-3 mb-10">
            <h3 className="text-2xl font-bold tracking-tight">No Results Found.</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              We couldn't find any courses matching your current search criteria.
            </p>
          </div>
          <Button 
            onClick={() => setCategoryFilter("all")}
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-zinc-200 hover:bg-zinc-50"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
