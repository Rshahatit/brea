# Brea - Software Design Document (SDD)

## Executive Summary

Brea is an AI dating liaison that conducts real-time voice conversations with users to understand their relationship preferences, then runs AI simulations to find compatible matches.

This document captures lessons learned from our initial implementation attempt and provides recommendations for a successful rebuild.

---

## Table of Contents

1. [Lessons Learned](#lessons-learned)
2. [Architecture Recommendations](#architecture-recommendations)
3. [Technology Stack Options](#technology-stack-options)
4. [Implementation Guide](#implementation-guide)
5. [Pitfalls to Avoid](#pitfalls-to-avoid)

---

## Lessons Learned

### What We Tried

| Component | Technology | Result |
|-----------|------------|--------|
| Mobile Framework | Expo (SDK 54) + React Native 0.81 | ❌ Major issues |
| JS Engine | Hermes (required by new arch) | ❌ Class inheritance bugs |
| UI Library | Tamagui | ⚠️ Babel conflicts with Daily SDK |
| Voice Transport | Daily.co WebRTC | ❌ Hermes incompatibility |
| Voice AI | Pipecat + Gemini Live | ✅ Works (Python side) |
| Auth | Firebase Web SDK | ❌ Native module registration failures |
| State | Zustand | ✅ Works |

### Critical Failures

#### 1. Daily SDK + Hermes + New Architecture = Broken

```
TypeError: Super expression must either be null or a function
```

**Root Cause:** The Daily WebRTC SDK (`@daily-co/react-native-webrtc`) uses ES6 class inheritance patterns that break under Hermes JavaScript engine with React Native's new architecture.

**Location:** `node_modules/@daily-co/react-native-webrtc/src/MediaStreamTrackEvent.ts:24`

**Why it can't be fixed:**
- Can't disable new architecture (react-native-reanimated requires it)
- Can't disable Hermes (required by Expo 54+ and new arch)
- Can't use older Expo (Daily SDK requires Expo 52+)

#### 2. Firebase Web SDK + React Native = Broken

```
Error: Component auth has not been registered yet
```

**Root Cause:** Firebase's modular web SDK (`firebase/auth`) relies on native module registration that happens asynchronously. When modules are imported at the top level, the native bridge isn't ready yet.

**Why lazy loading doesn't help:** Even with dynamic `import()`, the module evaluation still triggers class definitions that fail under Hermes.

#### 3. Tamagui Babel Plugin Conflicts

The Tamagui babel plugin transforms imports in ways that conflict with Daily SDK's class definitions, even with `exclude` patterns.

---

## Architecture Recommendations

### Option A: Native iOS (Swift) - RECOMMENDED

**Best for:** Production-quality app, full control, no Hermes issues

```
┌─────────────────────────────────────────────────────────────┐
│                     iOS App (Swift/SwiftUI)                  │
├─────────────────────────────────────────────────────────────┤
│  UI: SwiftUI                                                 │
│  Voice: Daily iOS SDK (native, no Hermes)                   │
│  Auth: Firebase iOS SDK (native)                            │
│  State: Combine/SwiftUI @State                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Server (Python)                    │
├─────────────────────────────────────────────────────────────┤
│  Framework: FastAPI                                          │
│  Voice Pipeline: Pipecat                                     │
│  LLM: Gemini 2.0 Flash (Multimodal Live)                    │
│  Transport: Daily.co WebRTC                                  │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Daily iOS SDK is mature and stable
- Firebase iOS SDK works perfectly
- No JavaScript engine issues
- Better performance
- Native audio handling

**Cons:**
- iOS only (need separate Android app)
- Swift learning curve if unfamiliar

### Option B: React Native (Bare Workflow, No Expo)

**Best for:** Cross-platform with more control

```
┌─────────────────────────────────────────────────────────────┐
│              React Native (Bare, No Expo)                    │
├─────────────────────────────────────────────────────────────┤
│  UI: React Native Paper or NativeWind                       │
│  Voice: LiveKit React Native SDK (NOT Daily)                │
│  Auth: @react-native-firebase/auth (native)                 │
│  State: Zustand                                              │
│  JS Engine: JSC (NOT Hermes)                                │
└─────────────────────────────────────────────────────────────┘
```

**Key changes from our attempt:**
1. **Use JSC instead of Hermes** - Avoids class inheritance issues
2. **Use @react-native-firebase (native)** - Not the web SDK
3. **Consider LiveKit instead of Daily** - Better RN support
4. **Skip Expo** - More control over native configuration
5. **Skip Tamagui** - Use simpler styling (NativeWind or Paper)

### Option C: Web App (Simplest)

**Best for:** Fast MVP, skip native entirely

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web App                           │
├─────────────────────────────────────────────────────────────┤
│  UI: Tailwind + Radix                                       │
│  Voice: Daily JS SDK (works perfectly in browser)           │
│  Auth: Firebase Web SDK (works in browser)                  │
│  State: Zustand                                              │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Everything works in the browser
- No native module issues
- Fastest to build
- PWA for mobile-like experience

**Cons:**
- Not a "real" mobile app
- Microphone permissions less smooth
- Can't distribute via App Store (easily)

---

## Technology Stack Options

### Voice Transport: Daily vs LiveKit

| Feature | Daily.co | LiveKit |
|---------|----------|---------|
| React Native Support | ⚠️ Hermes issues | ✅ Better RN support |
| iOS SDK | ✅ Excellent | ✅ Excellent |
| Pipecat Integration | ✅ Built-in | ✅ Built-in |
| Free Tier | 10k min/month | 50k min/month |
| Pricing | $0.004/min | $0.004/min |

**Recommendation:** For React Native, try **LiveKit**. For native iOS, either works.

### Auth: Firebase Web vs Native vs Alternatives

| Option | React Native | iOS Native | Notes |
|--------|-------------|------------|-------|
| Firebase Web SDK | ❌ Broken | N/A | Don't use in RN |
| @react-native-firebase | ✅ Works | N/A | Native module, proper setup |
| Firebase iOS SDK | N/A | ✅ Works | Swift-native |
| Supabase | ✅ Works | ✅ Works | Simpler, no native modules |
| Clerk | ✅ Works | ✅ Works | Hosted UI, easy |

**Recommendation:** Use **Supabase** or **Clerk** for simpler auth. If Firebase is required, use native SDKs only.

### UI Framework

| Option | Complexity | RN New Arch | Notes |
|--------|------------|-------------|-------|
| Tamagui | High | ⚠️ Conflicts | Babel plugin issues |
| NativeWind | Medium | ✅ Works | Tailwind for RN |
| React Native Paper | Low | ✅ Works | Material Design |
| Vanilla StyleSheet | Low | ✅ Works | No deps |
| SwiftUI (native) | Low | N/A | Best for iOS |

**Recommendation:** For RN, use **NativeWind** or **Paper**. Avoid Tamagui with voice SDKs.

---

## Implementation Guide

### If Starting Fresh with Native iOS (Swift)

#### 1. Project Setup
```bash
# Create new Xcode project
# Choose: iOS > App > SwiftUI
```

#### 2. Dependencies (Swift Package Manager)
```swift
// Package.swift or Xcode SPM
dependencies: [
    .package(url: "https://github.com/pipecat-ai/pipecat-client-ios-daily", from: "0.3.0"),
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.0.0"),
]
```

#### 3. Voice Session (Swift)
```swift
import PipecatClientIOSDaily
import Daily

class VoiceSession: ObservableObject {
    private var rtviClient: RTVIClient?

    func connect(userId: String) async throws {
        let transport = DailyTransport()

        rtviClient = RTVIClient(
            transport: transport,
            params: RTVIClientParams(
                baseUrl: "https://your-agent-server.com",
                endpoints: ["connect": "/connect"],
                config: [:]
            )
        )

        try await rtviClient?.connect()
    }
}
```

#### 4. Agent Server (Python - Same as before)
The Python Pipecat agent works perfectly. Keep it as-is.

### If Starting Fresh with React Native (No Expo)

#### 1. Project Setup
```bash
npx react-native init Brea --template react-native-template-typescript
cd Brea

# CRITICAL: Disable Hermes
# In android/gradle.properties:
# hermesEnabled=false

# In ios/Podfile, add:
# :hermes_enabled => false
```

#### 2. Dependencies
```bash
# Voice (try LiveKit instead of Daily)
npm install @livekit/react-native @livekit/react-native-webrtc

# Auth (native Firebase, NOT web SDK)
npm install @react-native-firebase/app @react-native-firebase/auth

# UI (simple, no babel plugins)
npm install nativewind tailwindcss

# State
npm install zustand
```

#### 3. Metro Config
```js
// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
```

#### 4. Critical: No New Architecture
```ruby
# ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '0'
```

---

## Pitfalls to Avoid

### ❌ DON'T: Use Firebase Web SDK in React Native
```typescript
// BAD - Will break with Hermes
import { getAuth } from 'firebase/auth';
```

```typescript
// GOOD - Use native SDK
import auth from '@react-native-firebase/auth';
```

### ❌ DON'T: Use Expo with Daily SDK (currently)
The combination of Expo 54 + Hermes + New Architecture + Daily WebRTC is broken. Wait for Daily to fix their SDK or use alternatives.

### ❌ DON'T: Use Tamagui with Voice SDKs
The Tamagui babel plugin conflicts with how voice SDK classes are compiled.

### ❌ DON'T: Assume Dynamic Imports Fix Hermes Issues
```typescript
// This STILL fails - module evaluation triggers the error
const Daily = await import('@daily-co/react-native-daily-js');
```

### ✅ DO: Test Voice SDK Immediately
Before building any UI, verify voice SDK works:
```typescript
// Test in isolation first
import Daily from '@daily-co/react-native-daily-js';
const call = Daily.createCallObject();
```

### ✅ DO: Use Short Room Expiry in Development
```python
# Rooms auto-delete, prevents orphaned rooms
"exp": int(time.time()) + 60  # 1 minute
```

### ✅ DO: Keep the Python Agent
The Pipecat + Gemini Live agent works perfectly. Don't change it.

---

## Recommended Fresh Start Path

### Fastest Path to Working Demo

1. **Build Web MVP first** (1-2 days)
   - Next.js + Daily JS SDK + Firebase Web
   - Everything works in browser
   - Validate the voice AI experience

2. **Then build native iOS** (1 week)
   - Swift/SwiftUI + Daily iOS SDK
   - Port the working experience
   - Ship to TestFlight

3. **Android later** (if needed)
   - Kotlin + Daily Android SDK
   - Or React Native bare (with JSC, not Hermes)

### Recommended Stack

```
Mobile:     Swift/SwiftUI (iOS) or Kotlin (Android)
Voice:      Daily native SDKs or LiveKit
Auth:       Supabase or Firebase native SDKs
Agent:      Python + Pipecat + Gemini Live (KEEP THIS)
Backend:    Fastify or FastAPI
Database:   Supabase (Postgres) or Prisma + any SQL
```

---

## Files to Keep from Current Implementation

These work and should be preserved:

### Agent (Python) ✅
- `packages/agent/bot.py` - Pipecat voice bot
- `packages/agent/main.py` - FastAPI room creation
- `packages/agent/intelligence.py` - Chip extraction

### Shared Types ✅
- `packages/shared/` - TypeScript types (adapt to Swift/Kotlin)

### Design Assets ✅
- `apps/mobile/assets/` - Icons and images

---

## Appendix: Error Reference

### Error: "Super expression must either be null or a function"
- **Cause:** Hermes can't handle certain ES6 class inheritance patterns
- **Solution:** Use JSC instead of Hermes, or use native SDKs

### Error: "Component auth has not been registered yet"
- **Cause:** Firebase web SDK native module not ready at import time
- **Solution:** Use @react-native-firebase (native) instead

### Error: "Cannot read property 'createCallObject' of undefined"
- **Cause:** Daily SDK module structure not loading correctly under Hermes
- **Solution:** Use native Daily SDK (iOS/Android) instead of React Native

### Error: Tamagui configuration not found
- **Cause:** Version mismatch or babel plugin conflicts
- **Solution:** Pin all @tamagui/* to same version, or use different UI lib

---

## Conclusion

The core concept of Brea works - the Python Pipecat agent successfully conducts voice conversations with Gemini Live. The issues are entirely on the mobile client side due to React Native ecosystem fragmentation.

**Recommendation:** Build native iOS app with Swift/SwiftUI and Daily iOS SDK. This eliminates all the JavaScript engine issues and provides the best user experience for voice interactions.

The React Native ecosystem is currently in flux with the new architecture transition. Many libraries (including Daily's React Native SDK) haven't fully adapted yet. Waiting 6-12 months may resolve these issues, but for shipping now, native development is more reliable.
