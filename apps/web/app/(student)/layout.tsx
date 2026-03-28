import { StudentSidebar } from "@/components/student-sidebar";
import { StudentHeader } from "@/components/student-header";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <StudentHeader />
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
