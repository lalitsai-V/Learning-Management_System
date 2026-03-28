import { InstructorSidebar } from "@/components/instructor-sidebar";
import { InstructorHeader } from "@/components/instructor-header";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <InstructorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InstructorHeader />
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
