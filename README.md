# Brea - AI Dating Liaison

## Setup Instructions

### Firebase Configuration
The mobile app uses Firebase for authentication. You need to provide your own Firebase configuration keys.

1.  Go to `apps/mobile/src/config/firebase.ts`.
2.  Replace the `firebaseConfig` object with your actual keys from the Firebase Console.

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Running the Project
```bash
npm run dev
```
This starts both the Backend (port 3000) and the Mobile App (Expo).
