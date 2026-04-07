import { cn } from "@repo/ui";
import { Progress } from "@repo/ui";
import {
  Users,
  Star,
  PlayCircle,
  BookOpen,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@repo/ui";

export interface CourseCardProps {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryColor?: string;
  rating: number;
  students: number | string;
  thumbnail: string;
  progress?: number;
  enrolled?: boolean;
  modulesCount?: number;
  isLearning?: boolean;
  onUnenroll?: (id: string) => void;
  
}

export function CourseCard({
  id,
  title,
  author,
  category,
  categoryColor = "bg-primary/10 text-primary",
  rating,
  students,
  thumbnail,
  progress,
  enrolled = false,
  modulesCount = 0,
  isLearning: isLearningProp,
  onUnenroll,
  
}: CourseCardProps) {
  const isLearning = isLearningProp ?? typeof progress === "number";
  const target = isLearning ? `/learn/${id}` : `/courses/${id}`;

  return (
    <div
      className={cn(
        "group flex flex-col bg-white rounded-3xl overflow-hidden shadow-premium hover:shadow-hover transition-all duration-300 border border-transparent hover:border-border/50",
      )}
    >
      {/* Thumbnail */}
      <Link href={target} className="relative aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 uppercase">
            <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
            {typeof rating === 'number' ? rating.toFixed(1) : rating}
          </div>
          <Link href={target}>
            <h3 className="font-bold text-[17px] leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[48px]">
              {title}
            </h3>
          </Link>
          {!isLearning && <p className="text-[13px] text-muted-foreground font-medium">by {author}</p>}
        </div>

        {/* Stats or Learning Progress */}
        {isLearning ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-primary">{progress ?? 0}%</span>
              </div>
              <Progress value={progress ?? 0} className="h-2 bg-primary/10" />
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20">
                <Link href={target}>
                  <PlayCircle className="h-4 w-4" strokeWidth={3} />
                  {progress === 100 ? "Review Course" : "Continue Learning"}
                </Link>
              </Button>
              {onUnenroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onUnenroll(id)}
                  className="h-11 w-11 shrink-0 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100/50"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-2 text-[13px] font-semibold text-muted-foreground border-t border-border/50">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {students}
            </span>
            <div className="h-1 w-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 font-bold">
              <BookOpen className="h-4 w-4" />
              {modulesCount} Modules
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-premium border border-border/50">
      <div className="aspect-[16/10] bg-muted animate-pulse" />
      <div className="p-6 space-y-4 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-6 bg-muted rounded w-full" />
          <div className="h-6 bg-muted rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}
