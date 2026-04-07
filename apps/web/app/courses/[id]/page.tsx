"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button, Badge } from "@repo/ui";
import { toast } from "sonner";
import { 
  Users, 
  Star, 
  BookOpen, 
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [modulesCount, setModulesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchCourseData() {
      if (!courseId) return;
      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch Course
        const { data: courseData, error: courseErr } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (courseErr) throw courseErr;
        setCourse(courseData);

        // Check Enrollment
        if (currentUser) {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("course_id", courseId)
            .eq("student_id", currentUser.id);

          if (enrollment && enrollment.length > 0) setIsEnrolled(true);
        }

        // Fetch Modules (count)
        const { count, error: modErr } = await supabase
          .from("modules")
          .select("*", { count: 'exact', head: true })
          .eq("course_id", courseId);

        if (modErr) throw modErr;
        setModulesCount(count || 0);

      } catch (err: any) {
        console.error("Error fetching course:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourseData();
  }, [courseId, supabase]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please log in to enroll", {
        description: "You need an account to track your progress."
      });
      router.push("/login");
      return;
    }

    if (isEnrolled) {
      router.push(`/dashboard`);
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          course_id: courseId,
          student_id: user.id
        });

      if (error) throw error;

      toast.success("Enrolled successfully! 🎉", {
        description: "You can find this course in My Learning."
      });
      setIsEnrolled(true);
      router.push(`/dashboard`);
    } catch (err: any) {
      toast.error("Enrollment failed", { description: err.message });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#F8FAFC]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Analyzing Course Architecture...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter">Course Not Found</h2>
          <p className="text-muted-foreground">The architecture you are looking for does not exist or has been moved.</p>
        </div>
        <Button onClick={() => router.push("/")} className="rounded-xl h-12 px-8 font-bold">Return to Home</Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar isMinimal={true} />
      
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12 text-center">
        {/* Back Button */}
        <div className="flex justify-start">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors tracking-[0.2em] uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Catalog
          </button>
        </div>

        {/* Thumbnail */}
        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-zinc-100">
          <img 
            src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header Info */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Badge className="bg-primary text-white border-none text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-md">
              {course.category || "Design"}
            </Badge>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Star className="h-4 w-4 fill-current" />
              <span>4.9</span>
            </div>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-zinc-950" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {course.title}
          </h1>

          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {course.description || "No description provided for this course yet."}
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4 pb-12 flex flex-col items-center gap-6">
          <Button 
            onClick={handleEnroll}
            disabled={enrolling}
            className="h-16 px-12 rounded-2xl bg-zinc-950 text-white font-bold text-[17px] shadow-2xl hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {isEnrolled ? "Continue Learning" : "Enroll for Free"}
            {!enrolling && <ArrowLeft className="h-5 w-5 rotate-180" />}
          </Button>
          
          <div className="flex items-center gap-8 text-[12px] font-bold text-zinc-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{modulesCount} Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Lifetime Access</span>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
