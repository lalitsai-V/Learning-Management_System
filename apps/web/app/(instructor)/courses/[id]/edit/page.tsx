"use client";

import { useEffect, useState } from "react";
import { Button, Badge, cn } from "@repo/ui";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  PlayCircle,
  FileText,
  Rocket,
  ArrowRight,
  Settings,
  Layout,
  Check,
  Upload,
  Loader2
} from "lucide-react";

import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useParams } from "next/navigation";



const STEPS = [
  { id: "01", name: "Course Info", icon: Layout },
  { id: "02", name: "Curriculum", icon: FileText },
  { id: "03", name: "Settings", icon: Settings },
];

const CATEGORIES = ["Development", "Design", "Business", "Marketing", "Photography", "Music"];

type LessonType = "video" | "article" | "assessment";

interface Lesson {
  id: string;
  dbId?: string;
  title: string;
  type: LessonType;
  content?: string;
  fileName?: string;
  fileSize?: string;
  expanded?: boolean;
}

interface Module {
  id: string;
  dbId?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  async function fetchCourseData() {
    setLoading(true);
    try {
      // 1. Fetch Course
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseErr) throw courseErr;
      if (!course) throw new Error("Course not found");

      setTitle(course.title);
      setDescription(course.description || "");
      setCategory(course.category || "Development");
      setThumbnailUrl(course.thumbnail_url || "");
      setIsPublished(course.is_published);

      // 2. Fetch Modules
      const { data: dbModules, error: modErr } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (modErr) throw modErr;

      const formattedModules: Module[] = [];

      for (const dbMod of dbModules || []) {
        // 3. Fetch Lessons for each module
        const { data: dbLessons, error: lessonErr } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_id", dbMod.id)
          .order("order_index", { ascending: true });

        if (lessonErr) throw lessonErr;

        formattedModules.push({
          id: dbMod.id.substring(0, 8),
          dbId: dbMod.id,
          title: dbMod.title,
          description: "", // Schema doesn't have module description yet, can add later
          expanded: false,
          lessons: (dbLessons || []).map(l => ({
            id: l.id.substring(0, 8),
            dbId: l.id,
            title: l.title,
            type: l.type as LessonType,
            content: l.content || "",
            fileName: l.media_url || "",
            expanded: false
          }))
        });
      }

      setModules(formattedModules);
    } catch (err: any) {
      toast.error("Failed to load course", { description: err.message });
      router.push("/courses");
    } finally {
      setLoading(false);
    }
  }

  const addModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: `Module ${prev.length + 1}: New Module`,
        description: "",
        lessons: [],
        expanded: true,
      },
    ]);
  };

  const addLesson = (moduleId: string, type: LessonType) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                { id: Math.random().toString(36).substr(2, 9), title: `New ${type} lesson`, type, expanded: true },
              ],
            }
          : m
      )
    );
  };

  const saveCourseToDB = async (publishStatus: boolean) => {
    if (!title) {
        toast.error("Title is required");
        return;
    }
    
    setSaving(true);
    try {
        // 1. Update Course
        const { error: courseErr } = await supabase
            .from("courses")
            .update({
                title,
                description,
                category,
                is_published: publishStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", courseId);

        if (courseErr) throw courseErr;

        // 2. Handle Modules and Lessons
        // For simplicity in this edit flow, we'll follow a basic structure:
        // In a real app, you'd track deletions. Here we'll just update existing or add new ones.
        
        for (let i = 0; i < modules.length; i++) {
            const mod = modules[i];
            if (!mod) continue;
            let currentModId = mod.dbId;

            if (!currentModId) {
                // Insert new module
                const { data: newMod, error: modErr } = await supabase
                    .from("modules")
                    .insert({
                        course_id: courseId,
                        title: mod.title,
                        order_index: i
                    })
                    .select()
                    .single();
                if (modErr) throw modErr;
                currentModId = newMod.id;
            } else {
                // Update existing module
                await supabase
                    .from("modules")
                    .update({ title: mod.title, order_index: i })
                    .eq("id", currentModId);
            }

            for (let j = 0; j < mod.lessons.length; j++) {
                const lesson = mod.lessons[j];
                if (!lesson) continue;
                if (lesson.dbId) {
                    // Update existing lesson
                    await supabase
                        .from("lessons")
                        .update({
                            title: lesson.title,
                            type: lesson.type,
                            content: lesson.content,
                            media_url: lesson.fileName,
                            order_index: j
                        })
                        .eq("id", lesson.dbId);
                } else {
                    // Insert new lesson
                    await supabase
                        .from("lessons")
                        .insert({
                            module_id: currentModId,
                            title: lesson.title,
                            type: lesson.type,
                            content: lesson.content,
                            media_url: lesson.fileName,
                            order_index: j
                        });
                }
            }
        }

        toast.success(publishStatus ? "Course published! 🎉" : "Changes saved", {
            description: publishStatus ? "Your updates are now live." : "Course draft updated successfully.",
        });
        
        if (publishStatus) {
            setTimeout(() => router.push("/courses"), 1500);
        }

    } catch (err: any) {
        toast.error("Failed to save changes", { description: err?.message });
    } finally {
        setSaving(false);
    }
  };

  async function handleVideoUpload(moduleId: string, lessonId: string, file: File) {
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `courses/${courseId}/lessons/${lessonId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      // 1. Update state immediately
      setModules(prev => prev.map(m => m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, fileName: publicUrl } : l)
      } : m));

      // 2. If this lesson already exists in DB, update it now
      const currentModule = modules.find(m => m.id === moduleId);
      const currentLesson = currentModule?.lessons.find(l => l.id === lessonId);
      
      if (currentLesson?.dbId) {
        const { error: dbErr } = await supabase
          .from("lessons")
          .update({ media_url: publicUrl })
          .eq("id", currentLesson.dbId);
        if (dbErr) throw dbErr;
      }

      toast.success("Video uploaded and synced!");
    } catch (err: any) {
      toast.error("Upload failed", { description: err.message });
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      {/* Stepper Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center gap-4 group">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300",
              currentStep === idx ? "bg-primary text-white shadow-lg shadow-primary/30" : 
              currentStep > idx ? "bg-green-500 text-white" : "bg-white border-2 border-border text-muted-foreground"
            )}>
              {currentStep > idx ? <Check className="h-6 w-6" strokeWidth={3} /> : step.id}
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest leading-none mb-1",
                currentStep >= idx ? "text-primary" : "text-muted-foreground"
              )}>
                Step {idx + 1}
              </span>
              <span className={cn(
                "text-[16px] font-bold tracking-tight",
                currentStep >= idx ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.name}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="hidden md:block w-12 h-[2px] bg-border mx-4" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border-none shadow-premium p-10 md:p-14">
        {currentStep === 0 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-2">
                <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Course Foundation</span>
                <h2 className="text-3xl font-bold tracking-tighter">Edit Basic Information</h2>
             </div>

             <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Thumbnail Image</label>
                  <div className="group relative aspect-video bg-[#F5F7FA] rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all outline-none">
                     {thumbnailUrl ? (
                         <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover rounded-3xl" alt="Preview" />
                     ) : (
                        <>
                           <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm text-primary mb-4 group-hover:scale-110 transition-transform">
                              <ImageIcon className="h-6 w-6" />
                           </div>
                           <p className="text-[14px] font-bold text-foreground">Click to update thumbnail</p>
                        </>
                     )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Course Title</label>
                  <input 
                    type="text" 
                    placeholder="Course Title"
                    className="w-full h-14 bg-[#F5F7FA] border-none rounded-2xl px-6 text-[15px] font-semibold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "h-12 rounded-xl text-[13px] font-bold transition-all border-2",
                          category === cat ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "bg-white border-border/50 text-muted-foreground hover:border-border"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                    <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Description</label>
                    <textarea 
                        className="w-full h-32 bg-[#F5F7FA] border-none rounded-2xl p-6 text-[15px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
             </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between">
               <div className="space-y-2">
                  <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Learning Path</span>
                  <h2 className="text-3xl font-bold tracking-tighter">Edit Curriculum</h2>
               </div>
               <Button onClick={addModule} className="bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl h-12 px-6 font-bold gap-2">
                 <Plus className="h-4 w-4" /> Add Module
               </Button>
             </div>

             <div className="space-y-6">
                {modules.map((mod, idx) => (
                   <div key={mod.id} className="bg-[#F5F7FA] rounded-[2rem] overflow-hidden">
                      <div className="p-6 flex items-center justify-between gap-4 cursor-pointer" onClick={() => {
                          setModules(prev => prev.map(p => p.id === mod.id ? { ...p, expanded: !p.expanded } : p))
                      }}>
                         <div className="flex items-center gap-4 flex-1">
                            <span className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-bold text-foreground shadow-sm">
                              {idx + 1}
                            </span>
                            <div className="flex-1 flex flex-col">
                                <input 
                                    type="text" 
                                    className="bg-transparent border-none text-[16px] font-bold text-foreground focus:ring-0 outline-none p-0 flex-1 hover:bg-white/50 rounded-md px-2 -ml-2 transition-all"
                                    value={mod.title}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setModules(prev => prev.map(p => p.id === mod.id ? { ...p, title: newTitle } : p));
                                    }} 
                                />
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              onClick={(e) => { e.stopPropagation(); addLesson(mod.id, "video"); }}
                            >
                               <PlayCircle className="h-4.5 w-4.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              onClick={(e) => { e.stopPropagation(); addLesson(mod.id, "article"); }}
                            >
                               <FileText className="h-4.5 w-4.5" />
                            </Button>
                            {mod.expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                         </div>
                      </div>

                       {mod.expanded && (
                           <div className="px-6 pb-6 space-y-4">
                              {mod.lessons.map((lesson) => (
                                 <div key={lesson.id} className="space-y-3">
                                    <div 
                                      onClick={() => {
                                        setModules(prev => prev.map(m => m.id === mod.id ? {
                                          ...m,
                                          lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, expanded: !l.expanded } : l)
                                        } : m));
                                      }}
                                      className={cn(
                                        "flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer group",
                                        lesson.expanded ? "border-primary/30 ring-2 ring-primary/5" : "border-border/10 hover:border-primary/20"
                                      )}
                                    >
                                       <div className={cn(
                                         "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                                         lesson.type === "video" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-600"
                                       )}>
                                          {lesson.type === "video" ? <PlayCircle className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
                                       </div>
                                       <div className="flex flex-col flex-1">
                                          <input 
                                            className="text-[14px] font-bold text-foreground bg-transparent border-none outline-none p-0 focus:bg-slate-50 rounded-md transition-all"
                                            value={lesson.title}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                              const newTitle = e.target.value;
                                              setModules(prev => prev.map(m => m.id === mod.id ? {
                                                ...m,
                                                lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, title: newTitle } : l)
                                              } : m));
                                            }}
                                          />
                                       </div>
                                       {lesson.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </div>

                                    {lesson.expanded && (
                                       <div className="mx-4 p-6 bg-white rounded-2xl border border-dashed border-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
                                           {lesson.type === "video" ? (
                                             <div className="space-y-4">
                                                {lesson.fileName ? (
                                                   <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner group/video">
                                                      <video 
                                                         src={lesson.fileName} 
                                                         controls 
                                                         className="w-full h-full object-contain"
                                                      />
                                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                                                         <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl font-bold text-sm hover:scale-105 transition-transform">
                                                            Change Video
                                                            <input 
                                                               type="file" 
                                                               accept="video/*" 
                                                               className="hidden" 
                                                               onChange={(e) => {
                                                                  const file = e.target.files?.[0];
                                                                  if (file) handleVideoUpload(mod.id, lesson.id, file);
                                                               }} 
                                                            />
                                                         </label>
                                                      </div>
                                                   </div>
                                                ) : (
                                                   <div className="flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border/60 rounded-3xl bg-slate-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                                                      <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                                         <Upload className="h-6 w-6" />
                                                      </div>
                                                      <div className="text-center">
                                                         <p className="text-[14px] font-bold text-foreground">Upload Lesson Video</p>
                                                         <p className="text-[12px] text-muted-foreground font-medium">MP4, WebM or Ogg (Max 500MB)</p>
                                                      </div>
                                                      <label className="cursor-pointer bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                                         Select File
                                                         <input 
                                                            type="file" 
                                                            accept="video/*" 
                                                            className="hidden" 
                                                            onChange={(e) => {
                                                               const file = e.target.files?.[0];
                                                               if (file) handleVideoUpload(mod.id, lesson.id, file);
                                                            }} 
                                                         />
                                                      </label>
                                                   </div>
                                                )}
                                             </div>
                                          ) : (
                                             <textarea 
                                                className="w-full h-48 bg-[#F5F7FA] border-none rounded-xl p-4 text-[14px] font-medium text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                                value={lesson.content}
                                                onChange={(e) => {
                                                   const newContent = e.target.value;
                                                   setModules(prev => prev.map(m => m.id === mod.id ? {
                                                      ...m,
                                                      lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, content: newContent } : l)
                                                   } : m));
                                                }}
                                             />
                                          )}
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>
                       )}
                   </div>
                ))}
             </div>
          </div>
        )}

        <div className="mt-16 pt-10 border-t border-border/50 flex items-center justify-between">
           <Button 
             variant="ghost" 
             onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
             className={cn("h-12 px-8 rounded-2xl font-bold text-muted-foreground", currentStep === 0 && "opacity-0 pointer-events-none")}
           >
             Previous Step
           </Button>
           
           <div className="flex items-center gap-4">
              <Button onClick={() => saveCourseToDB(false)} disabled={saving} variant="outline" className="h-12 px-8 rounded-2xl border-2 border-border font-bold">
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Changes"}
              </Button>
              {currentStep < 2 ? (
                <Button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="h-12 px-8 rounded-2xl bg-foreground text-white font-bold gap-2 hover:bg-zinc-800"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => saveCourseToDB(true)}
                  disabled={saving}
                  className="h-12 px-10 rounded-2xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {isPublished ? "Update Published Course" : "Publish Course"}
                </Button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
