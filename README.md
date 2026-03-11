# Aura - AI Productivity Platform

A production-quality AI-powered personal productivity platform that allows users to manage emails, tasks, and reminders using natural language with human-in-the-loop AI execution.

## Features

### Core Functionality
- **Natural Language Input**: Type commands like "Send an email to john@test.com about the meeting tomorrow"
- **AI Preview & Confirmation**: Always shows what the AI plans to do before execution
- **Human-in-the-Loop**: No silent actions - everything requires explicit confirmation
- **Activity Timeline**: Complete audit log of all AI interactions

### Advanced UX Features
- **AI Explainability**: "Why this?" section explaining AI decisions
- **Cognitive Load Awareness**: Visual indicator showing daily workload intensity
- **Automation Control**: Global toggle to pause/resume AI execution
- **Professional UI**: Clean, enterprise-grade design (not AI-looking)

### Technical Features
- **TypeScript**: Full type safety
- **Next.js 16**: Modern React framework with App Router
- **Tailwind CSS**: Professional styling with custom components
- **Session-based Auth**: Secure user authentication
- **n8n Integration**: AI processing via external webhook

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Run Development Server**
   ```bash
   pnpm dev
   ```

3. **Open Application**
   - Navigate to http://localhost:3000
   - Register a new account
   - Start using AI-powered productivity

## Project Structure

```
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── ai/             # AI processing endpoints
│   │   └── activity/       # Activity logging
│   ├── dashboard/          # Main application pages
│   ├── login/              # Login page
│   └── register/           # Registration page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── sidebar.tsx         # Professional navigation
│   ├── dashboard-header.tsx
│   ├── intent-preview.tsx
│   └── activity-timeline.tsx
├── lib/
│   ├── auth-simple.ts      # In-memory authentication
│   ├── n8n.ts             # AI webhook integration
│   └── db.ts              # Database utilities
└── styles/                # Global styles
```

## AI Integration

The application integrates with n8n for AI processing:

**Webhook Endpoint**: `https://n8n.mediajade.com/webhook/ai-task-agent`

**Request Format**:
```json
{
  "task": "user input text",
  "user_id": "user identifier",
  "intent_type": "email|task|reminder|chat",
  "preview_mode": true|false,
  "execute": true|false
}
```

**Response Format**:
```json
{
  "intent": "parsed intent",
  "action_payload": { ... },
  "final_message": "explanation",
  "is_preview": true,
  "requires_confirmation": true
}
```

## Authentication

Currently uses in-memory authentication for development. Features:
- User registration and login
- Session-based authentication with secure cookies
- Activity logging and audit trails

## UI Components

### Professional Design Principles
- Clean spacing and thoughtful typography
- Consistent color system with dark mode support
- Subtle animations and micro-interactions
- Enterprise-grade aesthetics

### Key Components
- **Sidebar**: Collapsible navigation with cognitive load indicators
- **Intent Preview**: AI action preview with confirmation flow
- **Activity Timeline**: Real-time audit log
- **Explainability Panel**: AI decision transparency

## Development Notes

### Environment Setup
- Uses pnpm for package management
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling

### Current Implementation
- In-memory storage for users and activities (development)
- Mock AI responses when webhook is unavailable
- Session-based authentication
- Real-time activity updates

### Production Considerations
- Replace in-memory storage with PostgreSQL
- Configure proper environment variables
- Set up n8n workflow with actual AI integration
- Implement proper error handling and logging

## License

MIT License - feel free to use this as a foundation for your own AI productivity platform.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

# AI Productivity Platform

A fully functional AI-powered productivity assistant that integrates with your Google account to manage emails, tasks, and calendar events through natural conversation.

## Features

- **AI-Powered Chat Interface**: Natural language processing to understand user intents
- **Email Management**: Send emails through your Gmail account
- **Task Creation**: Create and manage tasks in Google Tasks
- **Calendar Integration**: Schedule reminders and events in Google Calendar
- **Real-time Activity Feed**: Live updates of all your actions
- **Secure Authentication**: Google OAuth with encrypted token storage

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: Google OAuth
- **APIs**: Gmail API, Google Tasks API, Google Calendar API
- **AI**: OpenAI GPT-3.5-turbo for intent detection
- **Real-time**: Server-Sent Events (SSE)

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure the following:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Google Cloud Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Enable these APIs:
     - Gmail API
     - Google Tasks API
     - Google Calendar API
     - Google+ API (for user info)

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Copy the Client ID and Client Secret

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Fill in required fields:
     - Application name: "AI Productivity Platform"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/tasks`
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/userinfo.email`

### 3. OpenAI Setup

1. **Create OpenAI Account**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in

2. **Get API Key**
   - Go to "API Keys" section
   - Create a new secret key
   - Copy the API key

### 4. Install Dependencies

```bash
npm install
```

### 5. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### 1. Connect Your Google Account

1. Open the application in your browser
2. Click "Connect Google Account"
3. Sign in with your Google account
4. Grant the requested permissions

### 2. Use the AI Assistant

Once connected, you can use natural language commands like:

**Email Commands:**
- "Send an email to john@example.com about the meeting tomorrow"
- "Email my boss with the project update"

**Task Commands:**
- "Create a task to finish the quarterly report"
- "Add a task to call the client about the proposal"

**Reminder Commands:**
- "Remind me tomorrow at 9am about the team meeting"
- "Schedule a reminder for next Friday at 2pm"

**Chat Commands:**
- "What tasks do I have today?"
- "How's my productivity going?"

## API Endpoints

### Authentication
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - OAuth callback

### Actions
- `POST /api/email/send` - Send email
- `POST /api/tasks/create` - Create task
- `POST /api/calendar/create` - Create reminder/event
- `POST /api/chat/execute` - Process AI chat message

### Data
- `GET /api/activity` - Get recent activities
- `GET /api/activity/stream` - Real-time activity stream (SSE)

## Database Schema

The application uses SQLite with the following tables:

- **users** - User accounts and Google tokens
- **tasks** - Local task copies
- **reminders** - Local reminder copies
- **activities** - Action log and audit trail
- **messages** - Chat history

## Security

- Google OAuth 2.0 for secure authentication
- Encrypted storage of refresh tokens
- HTTP-only cookies for session management
- CORS protection for API endpoints
- Input validation and sanitization

## Development

### Project Structure

```bash
app/
├── api/                    # API routes
│   ├── auth/
│   ├── email/
│   ├── tasks/
│   ├── calendar/
│   ├── chat/
│   └── activity/
├── dashboard/              # Dashboard pages
└── page.tsx               # Landing page

lib/
└── services/              # Business logic services
    ├── googleAuthService.ts
    ├── gmailService.ts
    ├── googleTasksService.ts
    ├── calendarService.ts
    └── aiIntentService.ts

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
```

### Environment Variables

All sensitive configuration is stored in environment variables:

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `OPENAI_API_KEY` - OpenAI API key
- `NEXTAUTH_SECRET` - NextAuth secret for sessions
- `DATABASE_URL` - SQLite database path

## Troubleshooting

### Common Issues

1. **Google OAuth Error**
   - Ensure redirect URI matches exactly in Google Cloud Console
   - Check that all required APIs are enabled
   - Verify OAuth consent screen is properly configured

2. **API Errors**
   - Check environment variables are correctly set
   - Ensure Google APIs are enabled in Cloud Console
   - Verify network connectivity

3. **Database Issues**
   - Run `npx prisma migrate dev` to ensure schema is up to date
   - Check file permissions for database directory
   - Ensure Prisma client is generated: `npx prisma generate`

4. **OpenAI Issues**
   - Verify API key is valid and has credits
   - Check OpenAI service status
   - Ensure correct model is being used

### Logging

The application includes comprehensive logging:

- Authentication flows
- API requests and responses
- Google API interactions
- AI intent processing
- Database operations
- Error details and stack traces

Check the browser console and server logs for debugging information.

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Update Google OAuth redirect URI to production domain
3. Configure production database
4. Set up proper SSL certificates

### Database

For production, consider:
- PostgreSQL instead of SQLite for better performance
- Proper database backups
- Connection pooling
- Database monitoring

### Security

- Use environment-specific secrets
- Enable rate limiting
- Set up monitoring and alerting
- Regular security updates
- Audit logs and access patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Verify all configuration steps are complete
4. Test with a fresh Google account if needed

---


**Note**: This application requires active Google Cloud and OpenAI accounts with appropriate APIs enabled and sufficient quotas.
