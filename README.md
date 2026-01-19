# Brea - AI Dating Liaison

> "Let Brea handle it."

Brea is an AI-first dating experience that replaces swiping with real-time voice conversations. Brea learns your psychology through natural conversation, then deploys an autonomous agent to simulate compatibility with potential matches.

## Key Features

- **Native Voice Interaction**: Audio-to-Audio streaming via Gemini Live API for natural, human-like conversations
- **Visible Intelligence**: Real-time "Intelligence Chips" visualize what Brea learns during conversations
- **Compatibility Sandbox**: Agents run scenario simulations to produce comparable compatibility outputs
- **Privacy First**: Anonymous authentication, encrypted data, automatic retention policies

## Tech Stack

### Mobile App (`/apps/mobile`)
- React Native with Expo SDK 50+
- Firebase JS SDK (Anonymous Auth)
- Socket.io for real-time audio streaming
- Zustand for state management
- NativeWind (Tailwind CSS)

### Backend (`/packages/backend`)
- Fastify (Node.js)
- TypeScript
- Prisma (PostgreSQL)
- Firebase Admin SDK
- Gemini Multimodal Live API (WebSocket)
- Socket.io

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Firebase project
- Gemini API key

### Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd brea
   npm install
   ```

2. **Configure environment variables**

   Backend (`packages/backend/.env`):
   ```env
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/brea"
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GEMINI_API_KEY=your-gemini-api-key
   ```

   Mobile (`apps/mobile/.env`):
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3001
   EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   # ... other Firebase config
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm run backend

   # Terminal 2: Mobile
   npm run mobile
   ```

## Project Structure

```
/brea
├── /apps
│   └── /mobile              # Expo React Native app
│       ├── /app             # Expo Router screens
│       └── /src
│           ├── /components  # UI components
│           ├── /hooks       # Custom hooks
│           ├── /lib         # Firebase, API, Socket
│           ├── /stores      # Zustand stores
│           └── /types       # TypeScript types
│
└── /packages
    └── /backend             # Fastify Node.js server
        ├── /prisma          # Database schema
        └── /src
            ├── /lib         # Firebase, Prisma, Gemini
            ├── /middleware  # Auth middleware
            ├── /routes      # API routes
            ├── /services    # Business logic
            └── /types       # TypeScript types
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/upgrade` | Link anonymous account |
| GET | `/me` | Fetch user dossier |
| PATCH | `/me/profile` | Update profile data |
| POST | `/photos` | Upload photo |
| POST | `/arena/run` | Run compatibility simulation |
| GET | `/arena/matches` | Get match history |
| POST | `/consent` | Log consent event |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `session:start` | Client → Server | Start voice session |
| `audio:chunk` | Bidirectional | Stream audio data |
| `audio:end` | Client → Server | Signal end of speech |
| `brea:transcription` | Server → Client | Text transcription |
| `brea:intelligence_update` | Server → Client | Real-time chips |

## Architecture Decisions

1. **Audio-to-Audio**: We use Gemini's native audio generation instead of TTS for natural conversations
2. **Half-Duplex**: V1 does not support barge-in (interrupting the AI)
3. **Jitter Buffer**: Client-side buffering prevents audio glitches
4. **Fixed Scenarios**: Compatibility sandbox uses deterministic scenario templates for comparable results

## License

MIT
