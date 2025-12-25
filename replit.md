# MarketSenseAI

## Overview

MarketSenseAI is a financial stock analysis platform for the Indian stock market (NSE/BSE). Users enter a stock symbol and receive AI-generated comprehensive analysis reports covering fundamental analysis, technical analysis, risk factors, and buy/hold/avoid recommendations. The application uses OpenAI to generate detailed markdown reports that are stored in a PostgreSQL database and displayed with a modern financial dashboard aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Design System**: Professional financial theme inspired by MoneyControl, using Inter font for UI and JetBrains Mono for financial data
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints defined in shared routes file with Zod validation
- **Key Endpoints**:
  - `POST /api/analyze` - Create new stock analysis using AI
  - `GET /api/analyses` - List recent analyses
  - `GET /api/analyses/:id` - Get specific analysis

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Main Table**: `analyses` - stores stock symbol, markdown report, and timestamp
- **Additional Tables**: `conversations` and `messages` for chat functionality (defined in `shared/models/chat.ts`)

### AI Integration
- **Provider**: OpenAI via Replit AI Integrations
- **Purpose**: Generate comprehensive stock analysis reports in markdown format
- **Configuration**: Uses environment variables `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── replit_integrations/  # AI helper modules
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod
└── migrations/       # Database migrations
```

### Development Workflow
- **Dev Server**: `npm run dev` runs both Vite (frontend) and Express (backend) with HMR
- **Database**: `npm run db:push` pushes schema changes using Drizzle Kit
- **Build**: `npm run build` creates production bundle in `dist/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, requires `DATABASE_URL` environment variable

### AI Services
- **OpenAI API**: Stock analysis generation via Replit AI Integrations
  - `AI_INTEGRATIONS_OPENAI_API_KEY` - API key
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` - Base URL for API requests

### Key NPM Packages
- **Frontend**: react, wouter, @tanstack/react-query, react-markdown, date-fns, lucide-react
- **Backend**: express, drizzle-orm, openai, zod
- **UI**: Full shadcn/ui component suite with Radix UI primitives