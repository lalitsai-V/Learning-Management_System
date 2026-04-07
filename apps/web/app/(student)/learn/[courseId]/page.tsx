"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Progress, ScrollArea, Dialog, DialogContent, Button, cn } from "@repo/ui";
import { CheckCircle, Play, FileText, Trophy, ChevronDown, ArrowLeft, ArrowRight, Loader2, Star, X, ClipboardList } from "lucide-react";

import { toast } from "sonner";
import confetti from "canvas-confetti";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const supabase = createClient();
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [activeLessonId, setActiveLessonId] = useState("overview");
  const [showCompletion, setShowCompletion] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRating, setUserRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  const [showCurriculum, setShowCurriculum] = useState(false);

  useEffect(() => {
    async function fetchCourseContent() {
      if (!courseId) return;
      setLoading(true);
      try {
        const { data: { user : currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Fetch Course
        const { data: courseData } = await supabase
          .from("courses")
          .select("*, instructor:profiles(full_name)")
          .eq("id", courseId)
          .single();
        setCourse(courseData);

        // Fetch Modules & Lessons
        const { data: modulesData } = await supabase
          .from("modules")
          .select(`
            *,
            lessons(*)
          `)
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });
        
        // Sort lessons within modules
        const sortedModules = (modulesData || []).map(mod => ({
          ...mod,
          lessons: (mod.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index)
        }));
        
        setModules(sortedModules);
        if (sortedModules.length > 0) {
          setExpandedModules(new Set([sortedModules[0].id]));
        }

        // Fetch Progress
        if (currentUser) {
          const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("student_id", currentUser.id);
          
          if (progressData) {
            setCompletedIds(new Set(progressData.map(p => p.lesson_id)));
          }
        }

        // Check and sync enrollment progress
        if (currentUser && sortedModules.length > 0) {
           const { data: enrollment } = await supabase
            .from("enrollments")
            .select("progress_percent")
            .eq("course_id", courseId)
            .eq("student_id", currentUser.id)
            .single();

           const currentAllLessons = sortedModules.flatMap((m: any) => m.lessons);
           const currentLessonIds = new Set(currentAllLessons.map((l: any) => l.id));
           
           const { data: lessonProgressData } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("student_id", currentUser.id);

           const currentCompletedIds = new Set((lessonProgressData || []).map(p => p.lesson_id));
           const currentCompletedCurrentCourse = new Set([...currentCompletedIds].filter(id => currentLessonIds.has(id)));
           const calculatedProgress = currentAllLessons.length > 0 
              ? Math.min(100, Math.round((currentCompletedCurrentCourse.size / currentAllLessons.length) * 100)) 
              : 0;

           if (enrollment && enrollment.progress_percent !== calculatedProgress) {
              await supabase
                .from("enrollments")
                .update({ progress_percent: calculatedProgress })
                .eq("course_id", courseId)
                .eq("student_id", currentUser.id);
           }
        }

      } catch (err: any) {
        console.error("Error fetching course content:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCourseContent();
  }, [courseId, supabase]);

  const allLessons = modules.flatMap((m: any) => m.lessons);
  const currentCourseLessonIds = new Set(allLessons.map((l: any) => l.id));
  const completedCurrentCourseLessons = new Set([...completedIds].filter(id => currentCourseLessonIds.has(id)));
  const progress = allLessons.length > 0 ? Math.min(100, Math.round((completedCurrentCourseLessons.size / allLessons.length) * 100)) : 0;
  const activeLesson = allLessons.find((l: any) => l.id === activeLessonId);

  const toggleModule = (modId: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(modId)) newSet.delete(modId);
    else newSet.add(modId);
    setExpandedModules(newSet);
  };

  const markComplete = async (lessonId: string) => {
    if (!user || lessonId === "overview") return;
    
    try {
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          student_id: user.id,
          lesson_id: lessonId
        }, { onConflict: "student_id,lesson_id" });

      if (error) throw error;

      const newSet = new Set(completedIds);
      newSet.add(lessonId);
      setCompletedIds(newSet);

      // Recalculate and update enrollment progress in background
      if (allLessons.length > 0) {
        const updatedCompletedCourses = new Set([...newSet].filter(id => currentCourseLessonIds.has(id)));
        const currentProgress = Math.min(100, Math.round((updatedCompletedCourses.size / allLessons.length) * 100));
        
        const canComplete = currentProgress === 100;

        await supabase
          .from("enrollments")
          .update({ 
            progress_percent: currentProgress,
            is_completed: canComplete
          })
          .eq("student_id", user.id)
          .eq("course_id", courseId);
      }
      
      toast.success("Progress Updated", {
          description: "Your achievements have been synced.",
          icon: <CheckCircle className="h-4 w-4 text-green-500" />
      });

      if (allLessons.length > 0) {
        const updatedCompletedCourses = new Set([...newSet].filter(id => currentCourseLessonIds.has(id)));
        if (updatedCompletedCourses.size === allLessons.length) {
          setTimeout(() => {
            setShowCompletion(true);
            confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, colors: ["#3b82f6", "#2563eb", "#60a5fa"] });
          }, 400);
        }
      }
    } catch (err: any) {
      toast.error("Failed to update progress", { description: err.message });
    }
  };

  const submitRating = async (ratingValue: number) => {
    if (!user || !courseId) return;
    setUserRating(ratingValue);
    setSubmittingRating(true);
    try {
      const { error } = await supabase
        .from("course_ratings")
        .upsert({
          student_id: user.id,
          course_id: courseId,
          rating: ratingValue
        }, { onConflict: "student_id,course_id" });

      if (error) throw error;
      toast.success("Thank you for your feedback!");
    } catch (err: any) {
      toast.error("Failed to submit rating", { description: err.message });
    } finally {
      setSubmittingRating(false);
    }
  };





  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0C0C0C] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-white/40 uppercase tracking-widest animate-pulse">Initializing Stream...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[#0C0C0C] overflow-hidden flex-col md:flex-row">
      {/* Cinematic Main Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 order-1 md:order-none">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Bar */}
          <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
               <Link href="/dashboard" className="h-9 w-9 md:h-10 md:w-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all shrink-0">
                  <ArrowLeft className="h-4 w-4" />
               </Link>
               <div className="min-w-0">
                  <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1 block truncate">
                    {modules.find((m: any) => m.lessons.some((l: any) => l.id === activeLessonId))?.title || "Course Portal"}
                  </span>
                  <h1 className="text-[14px] md:text-[15px] font-bold text-white tracking-tight leading-none truncate pr-2">
                    {activeLessonId === "overview" ? "Course Introduction" : activeLesson?.title}
                  </h1>
               </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6 shrink-0">
                <div className="hidden sm:flex flex-col items-end gap-1">
                   <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-white">{progress}%</span>
                      <Progress value={progress} className="w-24 md:w-32 h-1 bg-white/10" />
                   </div>
                </div>
               
            </div>
          </div>

          {/* Immersive Player Content */}
          <div className="flex-1 relative flex items-center justify-center bg-black min-h-0">
             {activeLessonId === "overview" ? (
                <div className="w-full h-full bg-[#0C0C0C] flex items-center justify-center p-10 overflow-auto">
                   <div className="max-w-3xl w-full border-white/5 bg-white/[0.01] p-16 rounded-[3rem] border shadow-2xl space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                      <div className="space-y-6">
                        <span className="text-[12px] font-bold text-primary uppercase tracking-[0.4em] mb-4 block">Course Masterclass</span>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {course?.title}
                        </h1>
                        <div className="flex items-center gap-6 pt-4">
                           <div className="flex items-center gap-3">
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                              <span className="text-white/60 font-bold text-[14px]">Instructor: {course?.instructor?.full_name}</span>
                           </div>
                           <div className="h-1 w-1 rounded-full bg-white/20" />
                           <span className="text-white/60 font-bold text-[14px]">{modules.length} Modules</span>
                           <div className="h-1 w-1 rounded-full bg-white/20" />
                           <span className="text-white/60 font-bold text-[14px]">{allLessons.length} Lessons</span>
                        </div>
                      </div>

                      <div className="space-y-6 text-white/50 text-[18px] font-medium leading-[1.8] max-w-2xl border-l border-white/10 pl-8">
                         {course?.description}
                      </div>

                      <div className="pt-8 flex gap-4">
                         <Button 
                           className="h-14 px-10 rounded-2xl bg-primary text-white font-bold text-[15px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" 
                           onClick={() => {
                             if (allLessons.length > 0) setActiveLessonId(allLessons[0].id);
                           }}
                         >
                            Start Mastery Path
                            <Play className="h-4.5 w-4.5 ml-2 fill-current" />
                         </Button>
                      </div>
                   </div>
                </div>
             ) : activeLesson?.type === "video" ? (
                <div className="w-full h-full flex flex-col">
                   <div className="flex-1 bg-black relative overflow-hidden group shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
                      {activeLesson.media_url ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <video 
                             key={activeLesson.id}
                             src={activeLesson.media_url} 
                             className="w-full h-full object-contain pointer-events-auto"
                             controls
                             autoPlay
                           />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]">
                          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10 animate-pulse">
                            <Play className="h-8 w-8" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-white/80 font-bold uppercase tracking-[0.3em] text-sm">No Video Uploaded</p>
                            <p className="text-white/30 text-xs font-medium">This lesson doesn't have a video file yet.</p>
                          </div>
                        </div>
                      )}
                      

                   </div>
                </div>
             ) : (
                <div className="w-full h-full bg-white overflow-auto">
                   <div className="max-w-3xl mx-auto py-20 px-10 prose prose-lg prose-zinc text-left">
                      <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] mb-4 block">Article / Content</span>
                      <h1 className="text-5xl font-bold tracking-tighter mb-10">{activeLesson?.title}</h1>
                      <div className="space-y-6 text-zinc-600 font-medium leading-[1.8] whitespace-pre-wrap">
                        {activeLesson?.content || "No content provided for this lesson yet."}
                      </div>

                      <div className="mt-16 pt-8 border-t border-zinc-100 flex flex-col items-center gap-4">
                         <Button
                           onClick={() => markComplete(activeLessonId)}
                           disabled={completedIds.has(activeLessonId)}
                           className={cn(
                             "h-16 px-12 rounded-2xl font-bold text-[16px] transition-all flex items-center gap-3",
                             completedIds.has(activeLessonId)
                               ? "bg-green-50 text-green-600 border border-green-100 cursor-default"
                               : "bg-primary text-white hover:scale-[1.03] active:scale-[0.97] shadow-2xl shadow-primary/20"
                           )}
                         >
                           {completedIds.has(activeLessonId) ? (
                             <><CheckCircle className="h-6 w-6" strokeWidth={2.5} /> Completed</>
                           ) : (
                             <>Complete Lesson</>
                           )}
                         </Button>
                         <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                           {completedIds.size} of {allLessons.length} lessons finished
                         </p>
                      </div>
                   </div>
                </div>
             )}
          </div>

          {/* Player Bottom Navigation */}
          <div className="px-4 md:px-8 py-4 flex items-center justify-between border-t border-white/5 bg-black/40">
              <div className="flex gap-2 md:gap-4 overflow-x-auto pb-1 no-scrollbar min-w-0 pr-4">
                 <Button
                    variant="ghost"
                    onClick={() => setShowCurriculum(v => !v)}
                    className={cn(
                      "md:hidden gap-2 font-bold text-[12px] md:text-[13px] h-9 md:h-10 px-3 md:px-4 rounded-xl transition-all whitespace-nowrap",
                      showCurriculum ? "bg-primary text-white" : "text-white/60 hover:text-white"
                    )}
                 >
                    <ClipboardList className="h-4 w-4" /> Curriculum
                 </Button>
                 
                 {activeLessonId !== "overview" && (
                  <Button
                    onClick={() => markComplete(activeLessonId)}
                    disabled={completedIds.has(activeLessonId)}
                    className={cn(
                      "gap-2 font-bold text-[12px] md:text-[13px] h-9 md:h-10 px-6 md:px-8 rounded-xl transition-all whitespace-nowrap shadow-2xl",
                      completedIds.has(activeLessonId) 
                        ? "bg-green-500/20 text-green-500 border border-green-500/30 cursor-default" 
                        : "bg-primary text-white hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {completedIds.has(activeLessonId) ? (
                      <><CheckCircle className="h-4 w-4" /> Completed</>
                    ) : (
                      <>Mark as Complete</>
                    )}
                  </Button>
                )}
              </div>
             <div className="flex gap-2 shrink-0">
                <Button 
                   variant="ghost" 
                   disabled={allLessons.indexOf(activeLesson!) === 0}
                   onClick={() => {
                     const idx = allLessons.indexOf(activeLesson!);
                     if (idx > 0) setActiveLessonId(allLessons[idx - 1].id);
                   }}
                   className="text-white/40 h-10 w-10 md:h-14 md:w-14 rounded-2xl hover:bg-white/5 hover:text-white transition-all disabled:opacity-5"
                >
                   <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button 
                   variant="ghost" 
                   disabled={allLessons.indexOf(activeLesson!) === allLessons.length - 1}
                   onClick={() => {
                     const idx = allLessons.indexOf(activeLesson!);
                     if (idx < allLessons.length - 1) setActiveLessonId(allLessons[idx + 1].id);
                   }}
                   className="text-white/40 h-10 w-10 md:h-14 md:w-14 rounded-2xl hover:bg-white/5 hover:text-white transition-all disabled:opacity-5"
                >
                   <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
             </div>
          </div>
        </div>
      </div>



      {/* Curriculum Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-40 md:relative md:translate-x-0 w-[320px] md:w-[380px] border-l border-white/5 flex flex-col bg-[#0F0F0F] shrink-0 transition-transform duration-300 ease-in-out",
        showCurriculum ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"
      )}>
          <div className="p-6 md:p-8 border-b border-white/5 space-y-4 md:space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-[10px] md:text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">Course Curriculum</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className={cn("h-7 px-3 rounded-lg text-[10px] font-black tracking-widest uppercase", activeLessonId === "overview" ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white")} onClick={() => { setActiveLessonId("overview"); setShowCurriculum(false); }}>Overview</Button>
                  <Button variant="ghost" size="icon" className="md:hidden h-7 w-7 text-white/40" onClick={() => setShowCurriculum(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <h3 className="text-[16px] md:text-[18px] font-bold text-white tracking-tight">Modules & Lessons</h3>
                <span className="text-[12px] md:text-[13px] font-bold text-primary">{completedIds.size} / {allLessons.length}</span>
             </div>
          </div>
         
          <ScrollArea className="flex-1">
             <div className="p-4 md:p-6 space-y-4">
                {modules.map((mod) => {
                   const isExpanded = expandedModules.has(mod.id);
                   return (
                      <div key={mod.id} className="space-y-2">
                         <button 
                            onClick={() => toggleModule(mod.id)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-all group text-left"
                         >
                            <h4 className="text-[12px] md:text-[13px] font-black text-white/80 tracking-wide uppercase truncate pr-2">{mod.title}</h4>
                            <ChevronDown className={cn(
                               "h-4 w-4 text-white/20 transition-transform duration-300 shrink-0",
                               isExpanded ? "rotate-180" : ""
                            )} />
                         </button>
                         
                         <div className={cn(
                            "space-y-2 transition-all duration-300 overflow-hidden",
                            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                         )}>
                            {mod.lessons.map((lesson: any) => {
                               const isActive = lesson.id === activeLessonId;
                               const isDone = completedIds.has(lesson.id);
                               return (
                                  <button 
                                     key={lesson.id} 
                                     onClick={() => { setActiveLessonId(lesson.id); setShowCurriculum(false); }}
                                     className={cn(
                                        "w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all group border border-transparent",
                                        isActive ? "bg-white/5 border-white/10" : "hover:bg-white/[0.03]"
                                     )}
                                  >
                                     <div className={cn(
                                        "h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                        isDone ? "bg-green-500/10 text-green-500" : 
                                        isActive ? "bg-primary text-white" : "bg-white/5 text-white/40 group-hover:text-white/60"
                                     )}>
                                        {isDone ? <CheckCircle className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} /> : 
                                         lesson.type === "video" ? <Play className="h-3 w-3 md:h-4 md:w-4 fill-current" /> : 
                                         <FileText className="h-3 w-3 md:h-4 md:w-4" />}
                                     </div>
                                     <div className="flex flex-col items-start min-w-0">
                                        <span className={cn(
                                           "text-[13px] md:text-[14px] font-bold tracking-tight truncate w-full transition-colors text-left",
                                           isActive ? "text-white" : "text-white/60"
                                        )}>
                                           {lesson.title}
                                        </span>
                                        <span className="text-[10px] md:text-[11px] font-bold text-white/20 uppercase tracking-widest mt-0.5">{lesson.type}</span>
                                     </div>
                                  </button>
                               );
                            })}
                         </div>
                      </div>
                   );
                })}
             </div>
          </ScrollArea>
      </aside>


      {/* Completion Modal — fixed overlay so it's always centred */}
      {showCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowCompletion(false)}
          />
          {/* Card */}
          <div className="relative z-10 w-full max-w-md bg-[#0F0F0F] border border-white/10 rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent pointer-events-none" />

            {/* Trophy */}
            <div className="relative h-24 w-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary animate-pulse">
              <Trophy className="h-10 w-10" />
            </div>

            {/* Text */}
            <div className="relative space-y-3">
              <h1 className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Achievement{" "}
                <span className="text-primary italic">Unlocked.</span>
              </h1>
              <p className="text-white/60 text-[15px] leading-relaxed">
                You've successfully completed{" "}
                <span className="text-white font-bold">{course?.title}</span>.{" "}
                Rate your experience below:
              </p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => submitRating(star)}
                    disabled={submittingRating}
                    className="p-1 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= userRating ? "fill-primary text-primary" : "text-white/20 hover:text-white/40"
                      )}
                      strokeWidth={2.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="relative flex flex-col gap-3 w-full">
              <Button
                asChild
                className="w-full h-14 rounded-full bg-white text-black font-bold text-[14px] hover:bg-white/90 shadow-xl"
              >
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full h-14 rounded-full text-white/60 font-bold text-[14px] hover:text-white hover:bg-white/5"
                onClick={() => setShowCompletion(false)}
              >
                Stay in Portal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
