"use client";

import { useEffect, useState } from "react";
import { CourseCard, CourseCardSkeleton } from "@/components/course-card";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";

interface Course {
  id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  students: number;
  modulesCount: number;
  thumbnail: string;
}

export default function WishlistPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          course_id,
          courses (
            id,
            title,
            thumbnail_url,
            category,
            instructor_id,
            profiles:instructor_id (full_name),
            enrollments:enrollments(count),
            modules:modules(count),
            course_ratings:course_ratings(rating)
          )
        `)
        .eq('student_id', user.id);

      if (error) throw error;

      const formattedCourses = (data || []).map((item: any) => {
        const ratings = item.courses.course_ratings || [];
        const avgRating = ratings.length > 0
          ? ratings.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / ratings.length
          : 0;

        return {
          id: item.courses.id,
          title: item.courses.title,
          author: item.courses.profiles?.full_name || "Unknown Instructor",
          category: item.courses.category,
          rating: avgRating,
          students: (item.courses.enrollments?.[0] as any)?.count || 0,
          modulesCount: (item.courses.modules?.[0] as any)?.count || 0,
          thumbnail: item.courses.thumbnail_url || "https://images.unsplash.com/photo-1487958444663-51ce6046cc04?q=80&w=2070&auto=format&fit=crop"
        };
      });

      setCourses(formattedCourses);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleWishlistToggle = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In wishlist page, clicking toggle always removes it
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('student_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;

      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-12 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] leading-none text-red-500">Your Favorites</span>
          <h1 className="text-5xl font-bold tracking-tighter text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>Wishlist</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="card-premium px-6 py-2 border-none shadow-sm flex flex-col items-center justify-center min-w-[100px] h-14 bg-white">
              <span className="text-[16px] font-bold text-foreground">{courses.length}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Saved Items</span>
           </div>
        </div>
      </div>

      {/* Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {courses.map((course) => (
            <CourseCard 
              key={course.id} 
              {...course} 
              isInWishlist={true}
              onWishlistToggle={handleWishlistToggle}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white/50 rounded-[3rem] border-2 border-dashed border-border/50">
           <div className="h-20 w-20 rounded-[2.5rem] bg-red-50 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
              <Heart className="h-10 w-10 fill-current" />
           </div>
           <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter">Your wishlist is empty</h2>
              <p className="text-[15px] text-muted-foreground font-medium max-w-[300px] mx-auto">
                 Explore our premium curriculum and save the courses you want to master later.
              </p>
           </div>
           <Button asChild className="h-14 px-10 rounded-2xl bg-primary text-white font-bold text-[15px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Link href="/explore">Browse Courses</Link>
           </Button>
        </div>
      )}
    </div>
  );
}
