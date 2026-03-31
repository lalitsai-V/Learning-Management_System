"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@repo/ui";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  MoreVertical,
  Users,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  BarChart2,
  Loader2,
  BookOpen,
  Sparkles,
} from "lucide-react";


interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function InstructorCoursesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err: any) {
      toast.error("Failed to load courses", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(course: Course) {
    setTogglingId(course.id);
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !course.is_published, updated_at: new Date().toISOString() })
        .eq("id", course.id);

      if (error) throw error;
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id ? { ...c, is_published: !c.is_published } : c
        )
      );
      toast.success(
        course.is_published ? "Course unpublished" : "Course published! 🎉",
        { description: course.is_published ? "Students can no longer see this course." : "Your course is now live on Eduvora." }
      );
    } catch (err: any) {
      toast.error("Failed to update course", { description: err?.message });
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteCourse(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course deleted");
    } catch (err: any) {
      toast.error("Failed to delete course", { description: err?.message });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">
            Creator Studio
          </span>
          <h1 className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "Outfit, sans-serif" }}>
            My Courses
          </h1>
          <p className="text-muted-foreground font-medium text-sm">
            {courses.length} course{courses.length !== 1 ? "s" : ""} in your catalog
          </p>
        </div>
        <Button asChild id="create-course-btn" className="h-12 px-8 rounded-2xl bg-primary text-white font-bold gap-2 shadow-lg shadow-primary/20">
          <Link href="/courses/create">
            <Plus className="h-4 w-4" strokeWidth={3} />
            Create New Course
          </Link>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">No courses yet</h3>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm">
            Create your first course and share your knowledge with the world.
          </p>
          <Button asChild className="h-12 px-8 rounded-2xl bg-primary text-white font-bold gap-2">
            <Link href="/courses/create">
              <Sparkles className="h-4 w-4" />
              Create First Course
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-border/60 overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-6 p-6">
                {/* Thumbnail */}
                <div className="h-20 w-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                  {course.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5">
                      <BookOpen className="h-8 w-8 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <Badge
                      className={
                        course.is_published
                          ? "bg-green-100 text-green-700 border-none text-[10px] font-bold uppercase tracking-wider"
                          : "bg-zinc-100 text-zinc-500 border-none text-[10px] font-bold uppercase tracking-wider"
                      }
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    {course.category && (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {course.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[17px] text-foreground truncate">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 font-medium">
                      {course.description}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-2">
                    Updated {new Date(course.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold gap-2 border-border/60"
                    onClick={() => togglePublish(course)}
                    disabled={togglingId === course.id}
                  >
                    {togglingId === course.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : course.is_published ? (
                      <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                    ) : (
                      <><Eye className="h-3.5 w-3.5" /> Publish</>
                    )}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 px-4 rounded-xl font-bold gap-2 border-border/60"
                  >
                    <Link href={`/courses/${course.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 shadow-lg rounded-xl border-zinc-100 p-1">
                      <DropdownMenuItem className="p-0 rounded-lg overflow-hidden cursor-pointer" onClick={() => router.push(`/courses/${course.id}/analytics`)}>
                        <div className="flex items-center gap-2 w-full h-full p-2.5">
                          <BarChart2 className="h-4 w-4" /> Analytics
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="p-0 rounded-lg overflow-hidden cursor-pointer" onClick={() => router.push(`/courses/${course.id}/students`)}>
                        <div className="flex items-center gap-2 w-full h-full p-2.5">
                          <Users className="h-4 w-4" /> Students
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="mx-1 my-1 bg-zinc-50" />
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-600 focus:bg-red-50 flex items-center gap-2"
                        disabled={deletingId === course.id}
                        onClick={() => deleteCourse(course.id, course.title)}
                      >
                        {deletingId === course.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
