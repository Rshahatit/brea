# Brea - AI Dating Liaison

An AI-first mobile experience that replaces swiping with real-time voice interviews. Brea learns your psychology through natural conversation, then deploys your autonomous agent into a Compatibility Sandbox to simulate conversations with potential matches.

## Architecture

```
/brea
├── apps/
│   └── mobile/          # Expo React Native app (Tamagui)
└── packages/
    ├── backend/         # Fastify server (Socket.io, Prisma)
    └── shared/          # Shared types & Zod schemas
```

## Tech Stack

- **Mobile**: React Native (Expo SDK 50), Tamagui, Zustand, Socket.io-client
- **Backend**: Fastify, Socket.io, Prisma, Firebase Admin
- **AI**: Gemini Multimodal Live API (Audio-to-Audio)
- **Database**: PostgreSQL
- **Auth**: Firebase (Anonymous + Linked)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL database
- Firebase project
- Google AI API key (Gemini)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed database with personas
pnpm db:seed
```

### Environment Setup

Copy the example env files and fill in your credentials:

```bash
cp packages/backend/.env.example packages/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### Development

```bash
# Start backend server
pnpm dev:backend

# Start mobile app (in another terminal)
pnpm dev:mobile
```

## Features

- **Voice Onboarding**: Push-to-talk voice interaction with Brea
- **Intelligence Chips**: Real-time visualization of AI learning
- **Compatibility Sandbox**: Agent simulations to test compatibility
- **Consent-Gated Dating**: Full control over data sharing

## License

MIT
