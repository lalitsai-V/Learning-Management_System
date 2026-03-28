# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
git clone <your-repo-url>
cd mini_udemy
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file inside `apps/web/`:

```sh
cp apps/web/.env.example apps/web/.env
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Set Up the Database

1. Open your [Supabase Dashboard](https://supabase.com) → **SQL Editor**.
2. Run the contents of [`supabase-schema.sql`](./supabase-schema.sql) first.
3. Then run [`supabase-assessment.sql`](./supabase-assessment.sql) to enable the quiz system.

### 4. Run the Development Server

```sh
pnpm run dev
```

---

## 🗄️ Database Schema Overview

### Core Tables

| Table | Description |
|---|---|
| `profiles` | User profiles (linked to `auth.users`) with `role` (student/instructor) |
| `courses` | Main course metadata, thumbnails, and publishing status |
| `modules` | Logical sections within a course |
| `lessons` | Content (video, article, assessment) within modules |
| `enrollments` | Student-Course relationship and overall progress tracking |
| `lesson_progress`| Granular completion tracking for individual lessons |

### Interaction & Assessment Tables

| Table | Description |
|---|---|
| `wishlist` | Stores courses saved by students for later |
| `course_ratings` | Student reviews and 1–5 star ratings |
| `assessment_questions` | MCQ bank for course-specific final assessments |
| `assessment_attempts` | Results of student assessment attempts (score, passed/failed) |

---

## 🔒 Row Level Security (RLS)

- **Courses**: Publicly readable if `is_published`. Only owners (instructors) can CRUD.
- **Assessments**: Questions viewable only by enrolled students or the instructor.
- **Progress/Wishlist**: Strictly owned by the student (`auth.uid() = student_id`).
- **Instructor View**: Special policies allow instructors to see enrollment and wishlist counts for their own courses to power the notification system.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables)
- **Database/Auth**: Supabase (PostgreSQL)
- **UI Components**: Shared `@repo/ui` library (centralized via Turborepo)
- **State**: Zustand (for progress and real-time notifications)
- **Icons**: Lucide React

---

## 📜 Available Scripts

```sh
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
