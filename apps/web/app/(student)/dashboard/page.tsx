"use client";

import { useUIStore } from "@/lib/store";
import { CourseCard } from "@/components/course-card";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function StudentDashboardPage() {
  const { categoryFilter, setCategoryFilter } = useUIStore();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
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

      // Reset Lesson Progress for this course 
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      const moduleIds = modules?.map(m => m.id) || [];

      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .in("module_id", moduleIds);

        const lessonIds = lessons?.map(l => l.id) || [];

        if (lessonIds.length > 0) {
          await supabase
            .from("lesson_progress")
            .delete()
            .eq("student_id", user.id)
            .in("lesson_id", lessonIds);
        }
      }

      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId)
        .eq("student_id", user.id);

      if (error) throw error;

      setEnrolledCourses(prev => prev.filter(e => e.course_id !== courseId));
      toast.success("Unenrolled successfully", {
        description: "Your course progress has been reset."
      });
    } catch (err: any) {
      toast.error("Failed to unenroll", { description: err.message });
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
        <div className="space-y-3 md:space-y-4">
          <span className="text-[11px] md:text-[12px] font-bold text-primary uppercase tracking-[0.2em] leading-none">Student Dashboard</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>My Learning</h1>
        </div>
      </div>

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
      </div>


    </div>
  );
}
