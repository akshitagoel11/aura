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
