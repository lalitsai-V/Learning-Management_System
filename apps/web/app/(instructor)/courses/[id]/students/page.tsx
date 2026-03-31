"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { ArrowLeft, Users, Loader2, Mail, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Enrollment {
  id: string;
  enrolled_at: string;
  progress_percent: number;
  is_completed: boolean;
  student: StudentProfile | null;
}

export default function CourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const supabase = createClient();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollments() {
      setLoading(true);
      try {
        const { data, count, error } = await supabase
          .from("enrollments")
          .select(`
            id,
            enrolled_at,
            progress_percent,
            is_completed,
            student:profiles(id, full_name, email, avatar_url)
          `, { count: "exact" })
          .eq("course_id", courseId)
          .order("enrolled_at", { ascending: false });

        if (error) throw error;
        
        // Supabase returns an array for joins, but since it's a 1-to-1 here, we can cast it
        // sometimes it returns an object if the relation is unique, need to handle both
        const formattedData = (data || []).map((e: any) => ({
          ...e,
          student: Array.isArray(e.student) ? e.student[0] : e.student
        })) as Enrollment[];

        setEnrollments(formattedData);
        setStudentCount(count || formattedData.length);
      } catch (err) {
        console.error("Error fetching students data:", err);
        setStudentCount(0);
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchEnrollments();
    }
  }, [courseId, supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-6 border-b border-border/50 pb-8 mt-4">
        <Button asChild variant="ghost" className="h-12 w-12 rounded-2xl p-0 hover:bg-zinc-100">
          <Link href="/courses">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">Course Management</span>
          <h1 className="text-3xl font-bold tracking-tight">Enrolled Students</h1>
        </div>
      </div>

      {loading ? (
         <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border-2 border-dashed border-border/60 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-muted-foreground font-medium">Fetching enrollment data...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border-2 border-dashed border-border/60 bg-white">
          <div className="h-20 w-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">No Students Yet</h3>
          <p className="text-muted-foreground font-medium mb-8 max-w-sm">
            You don't have any students enrolled in this course right now.
          </p>
          <Button asChild className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
            <Link href="/courses">
              Back to Courses
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Student Roster</h2>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-bold">
              {studentCount} Enrolled
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="bg-white p-6 rounded-2xl border border-border/60 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                    {enrollment.student?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={enrollment.student.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-[16px] truncate">
                      {enrollment.student?.full_name || "Anonymous Student"}
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                    <a href={`mailto:${enrollment.student?.email}`} className="truncate hover:text-indigo-600 transition-colors">
                      {enrollment.student?.email || "No email visible"}
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-500 mt-2">
                    <span>Progress: {enrollment.progress_percent}%</span>
                    <span>{enrollment.is_completed ? "Completed" : "In Progress"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${enrollment.progress_percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
