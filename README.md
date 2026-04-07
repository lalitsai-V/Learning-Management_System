# Eduvora

Eduvora (formerly Lumina) is a modern, comprehensive Learning Management System (LMS) designed for both students and instructors. It provides a robust platform for course creation, enrollment, progress tracking, and student assessments.

## 🚀 Features

### For Instructors
- **Course Management:** Create, edit, and publish comprehensive courses.
- **Curriculum Builder:** Organize course content into modules and individual lessons (video, text, etc.).
- **Assessments:** Create mandatory final assessments with multiple-choice questions to test student knowledge.
- **Analytics:** Track student enrollments and monitor course performance.

### For Students
- **Learning Portal:** An intuitive, responsive interface for browsing and taking courses.
- **Progress Tracking:** Seamlessly track lesson completions and overall course progress.
- **Final Assessments:** Take course quizzes to complete the learning journey.
- **Authentication:** Easy login and registration using GitHub OAuth or email/password.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Authentication, Storage, Row Level Security)
- **Styling:** Tailwind CSS & Vanilla CSS variables
- **State Management:** Zustand
- **Monorepo:** Turborepo
- **UI Components:** Centralized `@repo/ui` component library
- **Icons:** Lucide React

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd EDUVORA-main
```

### 2. Install dependencies

This project uses `pnpm` as the package manager.

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `apps/web/` directory based on the provided example.

```bash
cp apps/web/.env.example apps/web/.env
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Database Setup

To set up the database schema and enable necessary features:

1. Open the [Supabase Dashboard](https://supabase.com) and navigate to the **SQL Editor**.
2. Run the provided SQL files in the project root to initialize the database:
   - `supabase-schema.sql` (Core tables and RLS policies)
   - `supabase-assessment.sql` (Assessment and quiz tables)
   - `supabase-discussions.sql` (If applicable)
   - `supabase-resources.sql` (If applicable)
   - `fix-profiles-rls.sql`
   - `migration-update-profiles.sql`

### 5. Run the Development Server

Start the Turborepo development environment:

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`.

## 🗄️ Database Architecture

Eduvora uses Supabase with a schema designed for scale and secured by strict Row Level Security (RLS) policies.

| Core Tables | Description |
|---|---|
| `profiles` | User profiles with `role` differentiation (student/instructor) |
| `courses` | Course metadata and publishing status |
| `modules` | Logical sections outlining course structure |
| `lessons` | Granular content within modules |
| `enrollments` | Student-Course relationships |
| `lesson_progress`| Completion state for specific lessons |
| `assessment_questions` | Question bank for final assessments |
| `assessment_attempts` | Records of student quiz attempts and scores |

## 🏗️ Repository Structure

This is a monorepo built with Turborepo:

- **`apps/web`**: The main Next.js application containing both the Student Portal and Instructor Dashboard.
- **`packages/ui`**: Shared React components used across the workspace.
- **`packages/eslint-config`**: Shared ESLint configuration.
- **`packages/typescript-config`**: Shared TypeScript configuration map.
