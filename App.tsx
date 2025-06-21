
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CreateListingPage from './pages/CreateListingPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import ListingDetailPage from './pages/ListingDetailPage';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

/*
Firebase Backend Setup Guide (Free Tier - Spark Plan):

1. Create Firebase Project:
   - Go to https://console.firebase.google.com/
   - Click "Add project", follow the setup steps.

2. Add Firebase to your Web App:
   - In your Firebase project, go to Project Overview -> Project settings.
   - Under "Your apps", click the Web icon (</>).
   - Register your app (give it a nickname).
   - Firebase will provide you with a firebaseConfig object. Copy this.
   - Install Firebase SDK: `npm install firebase` or `yarn add firebase`.
   - Create a `firebase.ts` (or `.js`) file in your `src` directory:
     ```typescript
     // src/firebase.ts
     import { initializeApp } from "firebase/app";
     import { getAuth } from "firebase/auth";
     import { getFirestore } from "firebase/firestore";
     import { getStorage } from "firebase/storage";

     const firebaseConfig = {
       apiKey: "YOUR_API_KEY", // Replace with your actual config
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };

     const app = initializeApp(firebaseConfig);
     export const auth = getAuth(app);
     export const db = getFirestore(app);
     export const storage = getStorage(app);
     ```
   - IMPORTANT: For security, use environment variables for your firebaseConfig values in a real app, especially the API key. For this project, you might store `process.env.API_KEY` for Gemini in a `.env` file (not committed to git) and load it using a build tool like Vite or Create React App. Firebase config itself is generally safe to be in client-side code if security rules are set up correctly, but API keys for other services (like Gemini) must be kept server-side or proxied.

3. Authentication:
   - In Firebase console: Authentication -> Get started.
   - Enable sign-in methods (e.g., Email/Password, Google).
   - Use `firebase/auth` functions (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `onAuthStateChanged`, etc.) in your React app.

4. Firestore Database (NoSQL):
   - In Firebase console: Firestore Database -> Create database.
   - Start in "test mode" for development (allows all reads/writes), then switch to "production mode" and set up Security Rules.
     Example `listings` collection rule (allow read for all, write only for authenticated users):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /listings/{listingId} {
           allow read: if true;
           allow write: if request.auth != null; // Only authenticated users can create/update/delete
           // Add more specific rules for updates, deletions, ownership
         }
         match /users/{userId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
   - Use `firebase/firestore` functions (`collection`, `addDoc`, `getDocs`, `doc`, `getDoc`, `updateDoc`, `deleteDoc`, `query`, `where`, `orderBy`, `onSnapshot` for real-time updates).

5. Storage:
   - In Firebase console: Storage -> Get started.
   - Set up Security Rules. Example (allow authenticated users to upload images to a specific path):
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /listing-images/{userId}/{fileName} { // User can only write to their own folder
           allow read: if true;
           allow write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
   - Use `firebase/storage` functions (`ref`, `uploadBytes`, `getDownloadURL`).

6. Cloud Functions (for backend logic like moderation triggers, user stats aggregation - Requires Node.js knowledge):
   - Set up Firebase CLI: `npm install -g firebase-tools`.
   - `firebase login`, then `firebase init functions` in your project root. Choose TypeScript or JavaScript.
   - Write functions in the `functions/src/index.ts` file.
   - Example (pseudo-code for new listing trigger):
     ```typescript
     // functions/src/index.ts
     import * as functions from "firebase-functions";
     import * as admin from "firebase-admin";
     admin.initializeApp();

     export const onListingCreate = functions.firestore
       .document("listings/{listingId}")
       .onCreate(async (snap, context) => {
         const listingData = snap.data();
         // Mark as pending moderation
         return snap.ref.update({ status: "pending_moderation" });
         // Optionally, send a notification to admins
       });
     ```
   - Deploy functions: `firebase deploy --only functions`.
   - Cloud Functions are part of the Blaze (pay-as-you-go) plan, but have a free tier for invocations.

7. Hosting:
   - `firebase init hosting`. Configure your public directory (usually `build` for Create React App, `dist` for Vite).
   - `npm run build` (or `yarn build`) to build your React app.
   - `firebase deploy --only hosting`.

User-to-user messaging: This is more complex. You'd typically create a `chats` collection in Firestore. Each chat document could hold messages between two users. Use Firestore real-time updates (`onSnapshot`) to display new messages.

Admin Panel: Admins would have special roles (e.g., a custom claim in Firebase Auth or a field in their user document). The frontend would show/hide admin sections based on this. Admin functions would interact with Firestore to approve/reject listings, manage users, etc.

This is a high-level overview. Each step involves detailed implementation and understanding of Firebase services.
*/


const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-lightBg dark:bg-darkBg">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-lightBg dark:bg-darkBg text-lightText dark:text-darkText">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route 
              path="/post-ad" 
              element={
                <ProtectedRoute>
                  <CreateListingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
    