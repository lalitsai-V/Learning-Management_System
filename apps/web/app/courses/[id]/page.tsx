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
  Clock, 
  PlayCircle, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Calendar
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
        // Fetch User Session
        const { data: { user : currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch Course
        const { data: courseData, error: courseErr } = await supabase
          .from("courses")
          .select(`
            *,
            instructor:profiles(full_name, avatar_url)
          `)
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
    <main className="min-h-screen bg-white selection:bg-primary/10">
      <Navbar isMinimal={true} />
      
      {/* Hero Section of Course */}
      <div className="bg-zinc-950 text-white py-24 relative overflow-hidden">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
         <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
             <div className="flex flex-col lg:flex-row gap-16">
                <div className="flex-[1.5] space-y-8">
                   <button 
                     onClick={() => router.back()} 
                     className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors tracking-[0.2em] uppercase"
                   >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Catalog
                   </button>

                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <Badge className="bg-primary text-white border-none text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-md">
                            {course.category || "Design"}
                         </Badge>
                         <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Premium Learning</span>
                      </div>
                      
                      <h1 className="text-5xl lg:text-7xl font-black tracking-[-0.04em] leading-[0.95] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                         {course.title}
                      </h1>

                      <p className="text-lg lg:text-xl font-medium text-zinc-400 max-w-2xl leading-relaxed">
                         {course.description || "No description provided for this knowledge architecture yet."}
                      </p>
                   </div>

                   <div className="flex flex-wrap items-center gap-8 pt-4">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none mb-1">Rating</span>
                            <span className="text-[14px] font-bold">4.9 / 5.0 (1.2k)</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right Card (Mobile hidden or shown differently) */}
                <div className="hidden lg:block flex-1" />
             </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 -mt-20 relative z-20 pb-32">
        <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Content Column */}
            <div className="flex-[1.5] space-y-12 pt-28">
               <div className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-tight">What you'll master</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {[
                        "Comprehensive architectural frameworks",
                        "Industry-standard design patterns",
                        "High-fidelity implementation strategies",
                        "Lifetime access to evolving updates",
                        "Peer-reviewed project milestones",
                        "Direct collaboration techniques"
                     ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-primary/20 transition-colors group">
                           <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                           <span className="text-[14px] font-semibold text-zinc-600 group-hover:text-zinc-900">{item}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="space-y-6 pt-6">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <h3 className="text-2xl font-bold tracking-tight">Curriculum Preview</h3>
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">{modulesCount} Modules Loaded</span>
                  </div>
                  <div className="space-y-4">
                     <p className="text-muted-foreground italic font-medium">Curriculum details are available upon enrollment.</p>
                  </div>
               </div>
            </div>

            {/* Sticky Enrollment Card */}
            <div className="flex-1 shrink-0 relative">
               <div className="sticky top-10 card-premium p-8 bg-white border-zinc-100 shadow-2xl space-y-8 rounded-[2.5rem] overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                  
                  <div className="relative aspect-video rounded-3xl overflow-hidden shadow-lg">
                     <img 
                       src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"} 
                       alt={course.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                     />
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-primary shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                           <PlayCircle className="h-8 w-8" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <span className="text-5xl font-black tracking-tighter" style={{ fontFamily: 'Outfit, sans-serif' }}>FREE</span>
                           <span className="text-zinc-300 line-through text-lg font-bold">$199.99</span>
                        </div>
                        <p className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] pl-1">Limited Time Opening</p>
                     </div>

                     <Button 
                       onClick={handleEnroll}
                       disabled={enrolling}
                       className="w-full h-16 rounded-2xl bg-foreground text-white font-bold text-[17px] shadow-xl hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                     >
                        {enrolling ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                        {isEnrolled ? "Continue Learning" : "Enroll Now"}
                        {!enrolling && <ArrowLeft className="h-5 w-5 rotate-180" />}
                     </Button>

                     <div className="space-y-4 pt-4 border-t border-zinc-50">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.25em] text-center">Core Architecture Components</p>
                        <div className="grid grid-cols-2 gap-y-4">
                           <div className="flex items-center gap-2.5 text-[13px] font-bold text-zinc-600">
                             <Clock className="h-4 w-4 text-primary" />
                             <span>24h content</span>
                           </div>
                           <div className="flex items-center gap-2.5 text-[13px] font-bold text-zinc-600">
                             <Calendar className="h-4 w-4 text-primary" />
                             <span>Weekly updates</span>
                           </div>
                           <div className="flex items-center gap-2.5 text-[13px] font-bold text-zinc-600">
                             <BookOpen className="h-4 w-4 text-primary" />
                             <span>{modulesCount} Modules</span>
                           </div>
                           <div className="flex items-center gap-2.5 text-[13px] font-bold text-zinc-600">
                             <Users className="h-4 w-4 text-primary" />
                             <span>Lifetime access</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
