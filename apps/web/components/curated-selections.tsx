"use client";

import { useEffect, useState, useCallback } from "react";
import { CourseCard, CourseCardSkeleton } from "./course-card";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";
import { useUIStore } from "@/lib/store";

export function CuratedSelections() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useUIStore();

  const fetchCoursesAndWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
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

      if (error) throw error;
      setCourses(data || []);

      
    } catch (err: any) {
      console.warn("Could not fetch data:", err?.message || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCoursesAndWishlist();
  }, [fetchCoursesAndWishlist]);

  

  const filteredCourses = courses.filter((course) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      course.title?.toLowerCase().includes(searchLower) ||
      course.category?.toLowerCase().includes(searchLower) ||
      course.instructor?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <section className="py-32 px-10 max-w-7xl mx-auto space-y-16" id="curated-section">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-6 max-w-2xl">
           <div className="inline-flex items-center gap-2 bg-primary/5 rounded-full px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">{searchQuery ? "Search Results" : "Latest Courses"}</span>
           </div>
           <h2 className="text-5xl lg:text-6xl font-black tracking-[-0.04em] text-foreground leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {searchQuery ? (
                <>
                  Explore <br />
                  <span className="text-primary italic">"{searchQuery}"</span>
                </>
              ) : (
                <>
                  Recently Published <br />
                  <span className="text-primary italic">Architecture.</span>
                </>
              )}
           </h2>
           <p className="text-[17px] font-semibold text-muted-foreground/80 leading-relaxed max-w-md">
             {searchQuery ? `Showing the best results for your search.` : `Explore the newest knowledge architectures crafted by our world-class instructors.`}
           </p>
        </div>
        
        <div className="flex gap-4">
           <Button variant="outline" size="icon" className="h-16 w-16 rounded-[2rem] border-zinc-100 bg-white hover:bg-zinc-50 transition-all shadow-sm">
              <ChevronLeft className="h-6 w-6 text-zinc-400" />
           </Button>
           <Button variant="outline" size="icon" className="h-16 w-16 rounded-[2rem] border-zinc-100 bg-white hover:bg-zinc-50 transition-all shadow-sm">
              <ChevronRight className="h-6 w-6 text-zinc-400" />
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              id={course.id}
              title={course.title}
              author={course.instructor?.full_name || "Unknown Instructor"}
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
        <div className="py-20 text-center">
          <p className="text-muted-foreground font-medium">No courses available at the moment. Check back soon!</p>
        </div>
      )}
    </section>
  );
}
