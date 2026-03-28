"use client";

import { useUIStore } from "@/lib/store";
import { CourseCard, CourseCardSkeleton } from "@/components/course-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui";
import { Plus, ArrowRight, Star, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function StudentDashboardPage() {
  const { categoryFilter, setCategoryFilter } = useUIStore();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          *,
          course:courses(
            *,
            instructor:profiles(full_name),
            enrollments:enrollments(count),
            modules:modules(count),
            course_ratings:course_ratings(rating)
          )
        `)
        .eq("student_id", user.id);

      if (enrollError) throw enrollError;
      setEnrolledCourses(enrollments || []);

      // Fetch Wishlist
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("course_id")
        .eq("student_id", user.id);
      
      if (wishlistData) {
        setWishlist(wishlistData.map(item => item.course_id));
      }

      // Fetch Recommendations
      const enrolledIds = enrollments.map(e => e.course_id);
      let query = supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles(full_name),
          enrollments:enrollments(count),
          modules:modules(count),
          course_ratings:course_ratings(rating)
        `)
        .eq("is_published", true);

      if (enrolledIds.length > 0) {
        query = query.not("id", "in", `(${enrolledIds.join(",")})`);
      }

      const { data: recs, error: recError } = await query.limit(4);
      if (!recError) setRecommendations(recs || []);

    } catch (err: any) {
      console.error("Error fetching dashboard data:", err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnenroll = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId)
        .eq("student_id", user.id);

      if (error) throw error;

      setEnrolledCourses(prev => prev.filter(e => e.course_id !== courseId));
      toast.success("Unenrolled successfully");
    } catch (err: any) {
      toast.error("Failed to unenroll", { description: err.message });
    }
  };

  const handleWishlistToggle = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isItemInWishlist = wishlist.includes(courseId);

      if (isItemInWishlist) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseId);
        setWishlist(prev => prev.filter(id => id !== courseId));
      } else {
        await supabase
          .from('wishlist')
          .insert({ student_id: user.id, course_id: courseId });
        setWishlist(prev => [...prev, courseId]);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Architecting your path...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <span className="text-[11px] md:text-[12px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Student Dashboard</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>My Learning</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-4">
          <Tabs value={categoryFilter === "all" ? "all" : categoryFilter} onValueChange={(val) => setCategoryFilter(val)} className="w-full sm:w-auto">
            <TabsList className="bg-[#F5F7FA] p-1 rounded-2xl h-12 gap-1 border-none shadow-sm w-full sm:w-auto flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-xl px-4 md:px-6 text-[12px] md:text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">ALL</TabsTrigger>
              <TabsTrigger value="Design" className="flex-1 sm:flex-none rounded-xl px-4 md:px-6 text-[12px] md:text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase">Design</TabsTrigger>
              <TabsTrigger value="Development" className="flex-1 sm:flex-none rounded-xl px-4 md:px-6 text-[12px] md:text-[13px] font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm uppercase">Dev</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none lg:card-premium px-4 md:px-6 py-2 border border-zinc-100 lg:border-none shadow-sm flex flex-col items-center justify-center min-w-[80px] md:min-w-[100px] h-12 md:h-14 bg-white rounded-2xl lg:rounded-3xl">
              <span className="text-[14px] md:text-[16px] font-bold text-foreground leading-none">{enrolledCourses.length}</span>
              <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Enrolled</span>
            </div>
            <div className="flex-1 sm:flex-none lg:card-premium px-4 md:px-6 py-2 border border-zinc-100 lg:border-none shadow-sm flex flex-col items-center justify-center min-w-[80px] md:min-w-[100px] h-12 md:h-14 bg-white rounded-2xl lg:rounded-3xl">
              <span className="text-[14px] md:text-[16px] font-bold text-foreground leading-none">
                {enrolledCourses.filter(e => e.is_completed).length}
              </span>
              <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((enrollment) => (
            <CourseCard 
              key={enrollment.course.id} 
              id={enrollment.course.id}
              title={enrollment.course.title}
              author={enrollment.course.instructor?.full_name || "Eduvora Architect"}
              category={enrollment.course.category || "General"}
              rating={(() => {
                const ratings = enrollment.course.course_ratings || [];
                if (ratings.length === 0) return 4.8;
                const sum = ratings.reduce((acc: any, r: any) => acc + (r.rating || 0), 0);
                return (sum / ratings.length);
              })()}
              students={(enrollment.course.enrollments?.[0] as any)?.count || 0} 
              modulesCount={(enrollment.course.modules?.[0] as any)?.count || 0}
              thumbnail={enrollment.course.thumbnail_url || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop"}
              isLearning={true}
              progress={enrollment.progress_percent}
              onUnenroll={handleUnenroll}
              isInWishlist={wishlist.includes(enrollment.course.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-2 card-premium p-12 text-center flex flex-col items-center justify-center bg-zinc-50 border-dashed border-zinc-200">
             <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-primary" />
             </div>
             <h3 className="text-xl font-bold">No Enrollments Yet</h3>
             <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
                You haven't architected your learning path with us yet.
             </p>
             <Link href="/explore">
               <Button className="mt-8 rounded-xl h-12 px-8 font-bold">Explore Courses</Button>
             </Link>
          </div>
        )}

        {/* Explore New Courses Card */}
        <div className="card-premium border-2 border-dashed border-border/60 bg-transparent shadow-none p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
           <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" strokeWidth={3} />
           </div>
           <h3 className="text-[18px] font-bold text-foreground mt-8">Expand Vision</h3>
           <p className="text-[14px] text-muted-foreground mt-2 max-w-[200px]">
              Ready to explore more knowledge architectures?
           </p>
           <Link href="/explore" className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mt-10 hover:underline">
             Browse Catalog
           </Link>
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="pt-20 space-y-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Curated for you</span>
              <h2 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>Elevate your skillset</h2>
            </div>
            <Link href="/explore" className="text-[13px] font-bold text-primary hover:underline group flex items-center gap-2">
              View All Recommendations
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {recommendations.map((course) => (
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
                isInWishlist={wishlist.includes(course.id)}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
