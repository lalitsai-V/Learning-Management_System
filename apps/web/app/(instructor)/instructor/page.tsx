"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@repo/ui";
import { Progress } from "@repo/ui";
import { Badge } from "@repo/ui";
import { cn } from "@repo/ui";
import {
  Users,
  Banknote,
  Activity,
  Star,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Loader2
} from "lucide-react";

const STATS = [
  { label: "Total Students", value: "0", sub: "Active", icon: Users, accent: "bg-indigo-50 text-indigo-600" },
  { label: "Enrollments", value: "0", sub: "Live", icon: Activity, accent: "bg-blue-50 text-blue-600" },
  { label: "Average Rating", value: "0.0", sub: "/ 5.0", icon: Star, accent: "bg-violet-50 text-violet-600" },
];


export default function InstructorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState(STATS);
  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Fetch Courses with counts
        const { data: coursesData } = await supabase
          .from("courses")
          .select(`
            *,
            enrollments:enrollments(count),
            modules:modules(count),
            course_ratings:course_ratings(rating)
          `)
          .eq("instructor_id", user.id)
          .limit(2);
        // Fetch All Courses for stats
        const { data: allCourses } = await supabase
          .from("courses")
          .select(`
            id,
            enrollments:enrollments(count)
          `)
          .eq("instructor_id", user.id);

        const totalStudents = allCourses?.reduce((acc, course) => 
          acc + ((course.enrollments?.[0] as any)?.count || 0), 0) || 0;

        // Fetch All Ratings for stats
        const { data: allRatings } = await supabase
          .from("course_ratings")
          .select("rating")
          .in("course_id", allCourses?.map(c => c.id) || []);

        const avgRating = allRatings && allRatings.length > 0
          ? (allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length).toFixed(1)
          : "0.0";

        setDashboardStats(prev => prev.map(stat => {
          if (stat.label === "Total Students") return { ...stat, value: totalStudents.toString() };
          if (stat.label === "Enrollments") return { ...stat, value: totalStudents.toString() };
          if (stat.label === "Average Rating") return { ...stat, value: avgRating };
          return stat;
        }));

        setCourses(coursesData || []);
      }
      setLoading(false);
    }
    loadDashboardData();
  }, [supabase]);

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="card-premium p-6 flex items-center gap-5 border-none shadow-premium bg-white">
            <div className={`h-14 w-14 rounded-2xl ${stat.accent} flex items-center justify-center shrink-0`}>
              <stat.icon className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight",
                  stat.sub === "High" ? "bg-orange-100 text-orange-600" : 
                  stat.sub === "Active" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {stat.sub}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {/* Active Curriculum Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-primary uppercase tracking-widest leading-none">Global Insights</span>
              <h2 className="text-3xl font-bold tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>
                 Welcome back, {profile?.full_name?.split(' ')[0] || "Instructor"}
              </h2>
            </div>
            <Link href="/courses" className="flex items-center gap-2 text-[14px] font-bold text-primary hover:underline transition-all">
              View All Courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.length > 0 ? courses.map((course) => (
              <div key={course.id} className="card-premium overflow-hidden group border-none shadow-premium bg-white">
                <div className="relative aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"} alt={course.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/95 text-foreground font-bold rounded-lg border-none shadow-sm px-3 py-1 text-[10px] uppercase">
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-[17px] tracking-tight leading-snug min-h-[50px]">{course.title}</h3>
                  <div className="flex items-center gap-4 text-[13px] font-semibold text-muted-foreground mt-4">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" /> 
                      {(course.enrollments?.[0] as any)?.count || 0} Students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> 
                      {(() => {
                        const count = (course.modules?.[0] as any)?.count || 0;
                        const totalMinutes = count * 20;
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        if (hours > 0) return `${hours}h ${mins}m`;
                        return `${mins}m`;
                      })()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> 
                      {(() => {
                        const ratings = course.course_ratings || [];
                        if (ratings.length === 0) return "0.0";
                        const sum = ratings.reduce((acc: any, r: any) => acc + (r.rating || 0), 0);
                        return (sum / ratings.length).toFixed(1);
                      })()}
                    </span>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[12px] font-bold text-muted-foreground">
                      <span>Course Progress</span>
                      <span className="text-primary">{course.is_published ? "100%" : "Draft"}</span>
                    </div>
                    <Progress value={course.is_published ? 100 : 30} className="h-2 bg-primary/10" />
                  </div>

                  <div className="flex items-center gap-3 mt-8">
                    <Button asChild className="flex-1 bg-[#F5F7FA] text-foreground hover:bg-primary hover:text-white border-none rounded-xl font-bold h-11 transition-all">
                      <Link href={`/courses/${course.id}/edit`}>Edit Content</Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-[#F5F7FA] text-muted-foreground">
                      <BarChart2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
               <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed text-center">
                  <p className="text-muted-foreground font-bold italic mb-4">No courses created yet.</p>
                  <Button asChild className="rounded-xl font-bold bg-primary text-white gap-2">
                     <Link href="/courses/create">Start Teaching Now</Link>
                  </Button>
               </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
