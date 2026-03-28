"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import {
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Reply,
} from "lucide-react";
import { toast } from "sonner";

interface Discussion {
  id: string;
  course_id: string;
  student_id: string;
  parent_id: string | null;
  is_instructor_reply: boolean;
  message: string;
  created_at: string;
  student: { full_name: string; avatar_url: string | null };
}

interface CourseGroup {
  course_id: string;
  course_title: string;
  threads: Discussion[]; // top-level messages
  replies: Record<string, Discussion[]>; // parent_id -> replies
}

function initials(name: string) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InstructorDiscussionsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // discussion id
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const fetchDiscussions = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      // Get instructor's courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", currentUser.id);

      if (!courses || courses.length === 0) {
        setCourseGroups([]);
        setLoading(false);
        return;
      }

      const courseIds = courses.map((c) => c.id);

      // Get all discussions (questions + replies) for those courses
      const { data: discussions, error } = await supabase
        .from("course_discussions")
        .select("*, student:profiles(full_name, avatar_url)")
        .in("course_id", courseIds)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by course
      const groups: CourseGroup[] = courses.map((course) => {
        const courseMsgs = (discussions || []).filter(
          (d) => d.course_id === course.id
        );
        const threads = courseMsgs.filter((d) => d.parent_id === null);
        const repliesMap: Record<string, Discussion[]> = {};
        courseMsgs
          .filter((d) => d.parent_id !== null && d.parent_id !== undefined)
          .forEach((reply) => {
            const pid = reply.parent_id as string;
            if (!repliesMap[pid]) repliesMap[pid] = [];
            repliesMap[pid].push(reply);
          });
        return {
          course_id: course.id,
          course_title: course.title,
          threads,
          replies: repliesMap,
        };
      });

      setCourseGroups(groups);

      // Auto expand courses that have messages
      const withMessages = groups
        .filter((g) => g.threads.length > 0)
        .map((g) => g.course_id);
      setExpandedCourses(new Set(withMessages));
    } catch (err: any) {
      console.error("Error fetching discussions:", err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDiscussions();

    // Realtime subscription (re-fetch on any change)
    const channel = supabase
      .channel("instructor-discussions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "course_discussions" },
        () => fetchDiscussions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDiscussions, supabase]);

  const sendReply = async (parentMsg: Discussion) => {
    const text = replyText[parentMsg.id]?.trim();
    if (!text || !user) return;
    setSending(parentMsg.id);
    try {
      const { error } = await supabase.from("course_discussions").insert({
        course_id: parentMsg.course_id,
        student_id: user.id,
        parent_id: parentMsg.id,
        is_instructor_reply: true,
        message: text,
      });
      if (error) throw error;
      setReplyText((prev) => ({ ...prev, [parentMsg.id]: "" }));
      setReplyingTo(null);
      toast.success("Reply sent!");
    } catch (err: any) {
      toast.error("Failed to send reply", { description: err.message });
    } finally {
      setSending(null);
    }
  };

  const totalMessages = courseGroups.reduce((a, g) => a + g.threads.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em]">
          Student Q&amp;A
        </span>
        <h1
          className="text-4xl font-black tracking-tighter text-foreground"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Discussions
        </h1>
        <p className="text-[15px] text-muted-foreground font-medium">
          {totalMessages === 0
            ? "No questions yet — check back soon."
            : `${totalMessages} question${totalMessages !== 1 ? "s" : ""} across your courses.`}
        </p>
      </div>

      {courseGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-border/50 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <MessageSquare className="h-7 w-7" />
          </div>
          <p className="font-bold text-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground">
            Create a course first to receive student questions.
          </p>
        </div>
      )}

      {courseGroups.map((group) => {
        const isExpanded = expandedCourses.has(group.course_id);

        return (
          <div
            key={group.course_id}
            className="bg-white rounded-[2rem] border border-border/50 shadow-sm overflow-hidden"
          >
            {/* Course Header */}
            <button
              onClick={() => {
                const next = new Set(expandedCourses);
                isExpanded ? next.delete(group.course_id) : next.add(group.course_id);
                setExpandedCourses(next);
              }}
              className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-[16px]">
                    {group.course_title}
                  </p>
                  <p className="text-[12px] text-muted-foreground font-medium">
                    {group.threads.length} question
                    {group.threads.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {/* Threads */}
            {isExpanded && (
              <div className="border-t border-border/50 divide-y divide-border/30">
                {group.threads.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-[14px] font-medium">
                    No questions yet for this course.
                  </div>
                ) : (
                  group.threads.map((thread) => {
                    const replies = group.replies[thread.id] || [];
                    const isThreadExpanded = expandedThreads.has(thread.id);
                    const isReplying = replyingTo === thread.id;

                    return (
                      <div key={thread.id} className="p-6 space-y-4">
                        {/* Student Question */}
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[13px] shrink-0">
                            {initials(thread.student?.full_name)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-foreground text-[14px]">
                                {thread.student?.full_name || "Student"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {formatTime(thread.created_at)}
                              </span>
                            </div>
                            <p className="text-[15px] text-foreground/80 font-medium leading-relaxed">
                              {thread.message}
                            </p>

                            {/* Action Row */}
                            <div className="flex items-center gap-4 pt-1">
                              <button
                                onClick={() =>
                                  setReplyingTo(isReplying ? null : thread.id)
                                }
                                className={cn(
                                  "flex items-center gap-1.5 text-[12px] font-bold transition-colors",
                                  isReplying
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                <Reply className="h-3.5 w-3.5" />
                                Reply
                              </button>
                              {replies.length > 0 && (
                                <button
                                  onClick={() => {
                                    const next = new Set(expandedThreads);
                                    isThreadExpanded
                                      ? next.delete(thread.id)
                                      : next.add(thread.id);
                                    setExpandedThreads(next);
                                  }}
                                  className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  {replies.length} repl{replies.length === 1 ? "y" : "ies"}
                                  {isThreadExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Existing Replies */}
                        {isThreadExpanded && replies.length > 0 && (
                          <div className="ml-14 space-y-3 border-l-2 border-primary/20 pl-4">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <div
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center font-black text-[11px] shrink-0",
                                    reply.is_instructor_reply
                                      ? "bg-primary text-white"
                                      : "bg-primary/10 text-primary"
                                  )}
                                >
                                  {initials(reply.student?.full_name)}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground text-[13px]">
                                      {reply.is_instructor_reply
                                        ? "You (Instructor)"
                                        : reply.student?.full_name || "Student"}
                                    </span>
                                    {reply.is_instructor_reply && (
                                      <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Instructor
                                      </span>
                                    )}
                                    <span className="text-[11px] text-muted-foreground">
                                      {formatTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-[14px] text-foreground/80 font-medium leading-relaxed">
                                    {reply.message}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Composer */}
                        {isReplying && (
                          <div className="ml-14 flex items-end gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-[11px] shrink-0">
                              {initials(user?.user_metadata?.full_name || "I")}
                            </div>
                            <div className="flex-1 flex items-end gap-2">
                              <textarea
                                rows={2}
                                value={replyText[thread.id] || ""}
                                onChange={(e) =>
                                  setReplyText((prev) => ({
                                    ...prev,
                                    [thread.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendReply(thread);
                                  }
                                }}
                                placeholder={`Reply to ${thread.student?.full_name || "student"}…`}
                                className="flex-1 resize-none bg-[#F5F7FA] border border-border/50 rounded-2xl px-4 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                              />
                              <Button
                                onClick={() => sendReply(thread)}
                                disabled={
                                  !replyText[thread.id]?.trim() ||
                                  sending === thread.id
                                }
                                className="h-11 w-11 rounded-xl bg-primary text-white shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                              >
                                {sending === thread.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
