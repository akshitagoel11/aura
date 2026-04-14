# Aura AI - Intelligent Productivity Platform

An AI-powered personal assistant that helps users manage tasks, schedules, and productivity using smart automation and insights.

## Features

- **Authentication**: Email + Google OAuth login with JWT session handling
- **Task Management**: Full CRUD with AI auto-categorization and duration estimation
- **AI Intent System**: Natural language processing to understand user commands
- **Smart Scheduling**: AI-optimized schedules based on habits and deadlines
- **Activity Tracking**: Track tasks, meetings, focus time, and breaks
- **Analytics Dashboard**: Productivity scores, completion rates, and trends
- **AI Assistant Panel**: Chat-like interface for natural interactions

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **State**: Zustand + React Query
- **AI**: OpenAI GPT (primary) + Google Gemini (fallback)
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional)

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd aura-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/aura_ai?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_GEMINI_API_KEY="your-gemini-api-key"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/                # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Auth pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── dashboard/      # Dashboard components
│   │   └── providers.tsx   # App providers
│   ├── lib/
│   │   ├── hooks/          # React Query hooks
│   │   ├── services/       # AI services
│   │   ├── stores/         # Zustand stores
│   │   ├── auth.ts         # NextAuth config
│   │   ├── prisma.ts       # Prisma client
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── index.ts        # TypeScript types
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## API Routes

### Tasks
- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks?id={id}` - Update a task
- `DELETE /api/tasks?id={id}` - Delete a task

### AI
- `POST /api/ai/intent` - Parse natural language intent
- `POST /api/ai/categorize` - Auto-categorize a task

### Schedule
- `GET /api/schedule` - Get schedules
- `POST /api/schedule` - Create a schedule
- `DELETE /api/schedule?id={id}` - Delete a schedule

### Activity
- `GET /api/activity` - List activities
- `POST /api/activity` - Create an activity
- `PATCH /api/activity?id={id}` - Update an activity

### Analytics
- `GET /api/analytics?period={period}` - Get analytics
- `POST /api/analytics` - Create/update analytics

## Database Schema

### User
- id, email, name, password, image, createdAt, updatedAt

### Task
- id, userId, title, description, category, priority, status, dueDate, estimatedDuration, actualDuration, aiGenerated, createdAt, updatedAt, completedAt

### Activity
- id, userId, type, title, description, metadata, startedAt, endedAt, duration, createdAt

### Schedule
- id, userId, date, title, description, status, aiGenerated, createdAt, updatedAt

### ScheduleEntry
- id, scheduleId, taskId, title, description, startTime, endTime, type, createdAt

### Analytics
- id, userId, date, productivityScore, tasksCompleted, tasksCreated, focusTime, breakTime, meetingTime, categoryData, createdAt, updatedAt

### UserPreference
- id, userId, workingHoursStart, workingHoursEnd, workingDays, timezone, aiProvider, theme, notifications, createdAt, updatedAt

## License

MIT
