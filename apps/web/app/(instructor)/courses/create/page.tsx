"use client";

import { useState, useRef } from "react";
import { Button } from "@repo/ui";
import { Badge } from "@repo/ui";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  PlayCircle,
  FileText,
  Trophy,
  Save,
  Rocket,
  ArrowRight,
  Settings,
  Layout,
  Check,
  Upload,
  Link as LinkIcon,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@repo/ui";
import { toast } from "sonner";
import { Progress } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: "01", name: "Course Info", icon: Layout },
  { id: "02", name: "Curriculum", icon: FileText },
  { id: "03", name: "Settings", icon: Settings },
];

const CATEGORIES = ["Development", "Design", "Business", "Marketing", "Photography"];

type LessonType = "video" | "article";

interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content?: string;
  fileName?: string;
  fileSize?: string;
  expanded?: boolean;
  uploading?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  expanded: boolean;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Development");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [modules, setModules] = useState<Module[]>([
    {
      id: "m1",
      title: "Module 1: Introduction",
      description: "Overview of the course and what we'll cover.",
      lessons: [
        { id: "l1", title: "Welcome to the Course", type: "video", fileName: "introduction_hd.mp4", fileSize: "24.5MB", expanded: false },
      ],
      expanded: true,
    },
  ]);


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

  async function handleThumbnailUpload(file: File) {
    setThumbnailUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `thumbnails/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      setThumbnailUrl(publicUrl);
      toast.success("Thumbnail uploaded!");
    } catch (err: any) {
      toast.error("Thumbnail upload failed", { description: err.message });
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function handleVideoUpload(moduleId: string, lessonId: string, file: File) {
    setModules(prev => prev.map(m => m.id === moduleId ? {
      ...m,
      lessons: m.lessons.map(l => l.id === lessonId ? { ...l, uploading: true } : l)
    } : m));

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `temp-courses/lessons/${lessonId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      setModules(prev => prev.map(m => m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, fileName: publicUrl, uploading: false } : l)
      } : m));

      toast.success("Video ready for publishing!");
    } catch (err: any) {
      setModules(prev => prev.map(m => m.id === moduleId ? {
        ...m,
        lessons: m.lessons.map(l => l.id === lessonId ? { ...l, uploading: false } : l)
      } : m));
      toast.error("Upload failed", { description: err.message });
    }
  }


  const saveCourseToDB = async (isPublished: boolean) => {
    if (!title) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();

      if (authErr || !user) {
        toast.error("You must be logged in to create a course. Please log in first.");
        setSaving(false);
        return;
      }

      let instructorId = user.id;

      // Insert Course
      const { data: course, error: courseErr } = await supabase
        .from("courses")
        .insert({
          instructor_id: instructorId,
          title,
          description,
          category,
          is_published: isPublished,
          thumbnail_url: thumbnailUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"
        })
        .select()
        .single();

      if (courseErr) throw courseErr;

      // Insert Modules & Lessons (Simplified for demo, iterating rather than bulk insert for easier ID matching)
      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod) continue;
        const { data: insertedMod, error: modErr } = await supabase
          .from("modules")
          .insert({
            course_id: course.id,
            title: mod.title,
            order_index: i
          })
          .select()
          .single();

        if (modErr) throw modErr;

        const lessonsToInsert = mod.lessons.map((l, lIdx) => ({
          module_id: insertedMod.id,
          title: l.title,
          type: l.type,
          content: l.content,
          media_url: l.fileName,
          order_index: lIdx
        }));

        if (lessonsToInsert.length > 0) {
          const { error: lessErr } = await supabase.from("lessons").insert(lessonsToInsert);
          if (lessErr) throw lessErr;
        }
      }

      toast.success(isPublished ? "Course published successfully! 🎉" : "Draft saved successfully", {
        description: isPublished ? "Your course is now live on the Eduvora network." : "You can continue editing later.",
        duration: 5000,
      });

      // Redirect back to courses list
      setTimeout(() => {
        router.push("/courses");
      }, 1500);

    } catch (err: any) {
      toast.error("Failed to save course", { description: err?.message || JSON.stringify(err) });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => saveCourseToDB(true);
  const handleSaveDraft = () => saveCourseToDB(false);


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
              <h2 className="text-3xl font-bold tracking-tighter">Basic Information</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Thumbnail Image</label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbnailUpload(file);
                  }}
                />
                <div
                  className="group relative aspect-video bg-[#F5F7FA] rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all outline-none overflow-hidden"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  {thumbnailUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Upload className="h-6 w-6 text-white" />
                        <p className="text-[13px] font-bold text-white">Change thumbnail</p>
                      </div>
                    </>
                  ) : thumbnailUploading ? (
                    <>
                      <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm text-primary mb-4">
                        <Upload className="h-6 w-6 animate-bounce" />
                      </div>
                      <p className="text-[14px] font-bold text-foreground">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-sm text-primary mb-4 group-hover:scale-110 transition-transform">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <p className="text-[14px] font-bold text-foreground">Click to upload thumbnail</p>
                      <p className="text-[12px] text-muted-foreground mt-1">Recommended size: 1600 x 900 px · JPG, PNG, WebP</p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Course Title</label>
                <input
                  type="text"
                  placeholder="Mastering Advanced UI Design"
                  className="w-full h-14 bg-[#F5F7FA] border-none rounded-2xl px-6 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
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
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Learning Path</span>
                <h2 className="text-3xl font-bold tracking-tighter">Curriculum Builder</h2>
              </div>
              <Button onClick={addModule} className="bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl h-12 px-6 font-bold gap-2">
                <Plus className="h-4 w-4" /> Add Module
              </Button>
            </div>

            <div className="space-y-6">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="bg-[#F5F7FA] rounded-[2rem] overflow-hidden">
                  <div className="p-6 flex items-center justify-between gap-4 cursor-pointer">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="h-10 w-10 rounded-xl bg-white flex items-center justify-center font-bold text-foreground shadow-sm">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        className="bg-transparent border-none text-[16px] font-bold text-foreground focus:ring-0 outline-none p-0 flex-1 hover:bg-white/50 rounded-md px-2 -ml-2 transition-all"
                        value={mod.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setModules(prev => prev.map(p => p.id === mod.id ? { ...p, title: newTitle } : p));
                        }}
                      />
                      <textarea
                        placeholder="Add a brief description for this module..."
                        className="w-full bg-transparent border-none text-[13px] text-muted-foreground focus:ring-0 outline-none p-0 resize-none h-12 mt-2"
                        value={mod.description}
                        onChange={(e) => {
                          const newDesc = e.target.value;
                          setModules(prev => prev.map(p => p.id === mod.id ? { ...p, description: newDesc } : p))
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        onClick={(e) => { e.stopPropagation(); addLesson(mod.id, "video"); }}
                        title="Add Video Lesson"
                      >
                        <PlayCircle className="h-4.5 w-4.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        onClick={(e) => { e.stopPropagation(); addLesson(mod.id, "article"); }}
                        title="Add Doc Lesson"
                      >
                        <FileText className="h-4.5 w-4.5" />
                      </Button>
                      <div className="w-px h-4 bg-border/50 mx-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-400 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

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
                          <div className="flex flex-col flex-1 gap-1">
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
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                                lesson.type === "video" ? "bg-primary/5 text-primary" : "bg-blue-50 text-blue-500"
                              )}>
                                {lesson.type === "video" ? "VIDEO CONTENT" : "DOCUMENTATION"}
                              </span>
                              {lesson.fileName && (
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-500" /> {lesson.fileName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-400 group-hover:opacity-100 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModules(prev => prev.map(m => m.id === mod.id ? {
                                  ...m,
                                  lessons: m.lessons.filter(l => l.id !== lesson.id)
                                } : m));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {lesson.expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>

                        {lesson.expanded && (
                          <div className="mx-4 p-6 bg-white rounded-2xl border border-dashed border-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
                            {lesson.type === "video" ? (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Video Resource</h4>
                                  {lesson.fileName && <Badge variant="outline" className="text-[10px] h-5">{lesson.fileSize}</Badge>}
                                </div>
                                <div className="group relative h-40 bg-[#F5F7FA] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all outline-none overflow-hidden">
                                  {lesson.uploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                      <p className="text-[13px] font-bold text-foreground">Uploading video...</p>
                                    </div>
                                  ) : lesson.fileName ? (
                                    <div className="absolute inset-0 bg-black">
                                      <video
                                        src={lesson.fileName}
                                        className="w-full h-full object-contain"
                                        controls
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleVideoUpload(mod.id, lesson.id, file);
                                        }}
                                      />
                                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="h-4 w-4" />
                                      </div>
                                      <p className="text-[13px] font-bold text-foreground">Click to upload video</p>
                                      <p className="text-[11px] text-muted-foreground mt-1 text-center px-4">Maximum size: 50MB. Supported formats: .mp4, .mov, .mkv</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Article Content</h4>
                                <textarea
                                  placeholder="Write or paste your article content here..."
                                  className="w-full h-48 bg-[#F5F7FA] border-none rounded-xl p-4 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                  value={lesson.content}
                                  onChange={(e) => {
                                    const newContent = e.target.value;
                                    setModules(prev => prev.map(m => m.id === mod.id ? {
                                      ...m,
                                      lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, content: newContent } : l)
                                    } : m));
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Course Resources</span>
              <h2 className="text-3xl font-bold tracking-tighter">Settings &amp; Resources</h2>
              <p className="text-[15px] text-muted-foreground font-medium">
                Add helpful links for your students — documentation, tools, articles, or any external resource.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[13px] font-bold text-foreground uppercase tracking-wider">Course Description</label>
              <textarea
                placeholder="Describe what students will learn, prerequisites, and what makes this course unique..."
                className="w-full h-36 bg-[#F5F7FA] border-none rounded-2xl px-6 py-4 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
            <Button onClick={handleSaveDraft} disabled={saving} variant="outline" className="h-12 px-8 rounded-2xl border-2 border-border font-bold">
              Save Draft
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
                onClick={handlePublish}
                disabled={saving}
                className="h-12 px-10 rounded-2xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {saving ? <Upload className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {saving ? "Publishing..." : "Publish Course"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
