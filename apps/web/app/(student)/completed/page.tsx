"use client";

import { useUIStore } from "@/lib/store";
import { CourseCard, CourseCardSkeleton } from "@/components/course-card";
import { CheckCircle, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function CompletedCoursesPage() {
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
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

      // Fetch Completed Enrollments
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
        .eq("student_id", user.id)
        .eq("is_completed", true);

      if (enrollError) throw enrollError;
      setCompletedCourses(enrollments || []);

      // Fetch Wishlist (to support wishlist toggle on cards)
      const { data: wishlistData } = await supabase
        .from("wishlist")
        .select("course_id")
        .eq("student_id", user.id);
      
      if (wishlistData) {
        setWishlist(wishlistData.map(item => item.course_id));
      }

    } catch (err: any) {
      console.error("Error fetching completed courses:", err.message);
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

      setCompletedCourses(prev => prev.filter(e => e.course_id !== courseId));
      toast.success("Removed from your learning list");
    } catch (err: any) {
      toast.error("Failed to remove course", { description: err.message });
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
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Achievements</span>
          <h1 className="text-5xl font-bold tracking-tighter text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Completed Courses</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="card-premium px-6 py-2 border-none shadow-sm flex flex-col items-center justify-center min-w-[120px] h-14 bg-white">
            <span className="text-[16px] font-bold text-foreground">{completedCourses.length}</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Courses Finished</span>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {completedCourses.length > 0 ? (
          completedCourses.map((enrollment) => (
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
              progress={100}
              onUnenroll={handleUnenroll}
              isInWishlist={wishlist.includes(enrollment.course.id)}
              onWishlistToggle={handleWishlistToggle}
            />
          ))
        ) : (
          <div className="md:col-span-3 card-premium p-12 text-center flex flex-col items-center justify-center bg-zinc-50 border-dashed border-zinc-200">
             <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-primary" />
             </div>
             <h3 className="text-xl font-bold">No Completed Courses</h3>
             <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
                Keep learning! Once you finish a course, it will appear here.
             </p>
             <Link href="/dashboard">
               <Button className="mt-8 rounded-xl h-12 px-8 font-bold">Continue Learning</Button>
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
