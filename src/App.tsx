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
Firebase Backend Integration Notes:

1. Firebase Configuration (`src/firebase.ts`):
   - This file initializes Firebase with your project's configuration.
   - **ACTION REQUIRED:** You MUST replace placeholder values in `src/firebase.ts` with your actual Firebase project config.
   - For Vercel/production, use environment variables for these config values (e.g., `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` or `process.env.REACT_APP_FIREBASE_API_KEY`).

2. Firebase Services Used:
   - **Authentication:** For user sign-up, login, logout. Managed in `AuthContext.tsx`.
   - **Firestore Database:** For storing user profiles (in `users` collection) and listings (in `listings` collection). Managed in `AuthContext.tsx` and `ListingContext.tsx`.
   - **Firebase Storage:** For storing uploaded images for listings. Managed in `ListingContext.tsx` and `CreateListingPage.tsx`.

3. Security Rules (CRITICAL - Set these in your Firebase Console):
   - **Firestore (`users` collection):**
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} {
           allow read: if true; // Allow public read of non-sensitive profile info if needed
           // Allow user to create their own profile document
           allow create: if request.auth != null && request.auth.uid == userId;
           // Allow user to update their own profile document
           allow update: if request.auth != null && request.auth.uid == userId;
           // Deletion of user documents might be restricted or handled by admin/functions
           allow delete: if request.auth != null && request.auth.uid == userId; 
           // Ensure `isAdmin` field can only be set by a trusted source (e.g., a Cloud Function or manually by an admin in console)
           // Example: prevent client from setting isAdmin:
           // allow update: if request.auth != null && request.auth.uid == userId && (!('isAdmin' in request.resource.data) || request.resource.data.isAdmin == resource.data.isAdmin);

         }
       }
     }
     ```
   - **Firestore (`listings` collection):**
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /listings/{listingId} {
           allow read: if true; // All users can read listings
           
           // Only authenticated users can create listings
           allow create: if request.auth != null; 
                         // Additionally, check if sellerId matches auth.uid
                         // && request.resource.data.sellerId == request.auth.uid;
           
           // Only the owner or an admin can update/delete listings
           allow update, delete: if request.auth != null && 
                                   (request.auth.uid == resource.data.sellerId || 
                                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
           
           // Specific rule for updating 'status' (e.g., by admin) might be needed if update rule is too broad
           // For example, if only admin can change status:
           // match /listings/{listingId} {
           //   function isOwner() { return request.auth.uid == resource.data.sellerId; }
           //   function isAdmin() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true; }
           //   allow update: if request.auth != null && ( 
           //     (isOwner() && !( 'status' in request.resource.data && request.resource.data.status != resource.data.status )) || // owner can update if not changing status
           //     isAdmin() // admin can update anything, including status
           //   );
           // }
         }
       }
     }
     ```
   - **Firebase Storage (Example for `listing-images`):**
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         // Path for listing images: listing-images/{userId}/{listingId}/{imageName}
         match /listing-images/{userId}/{listingId}/{allPaths=**} {
           // Allow anyone to read images (e.g., for display in listings)
           allow read: if true; 
           // Allow write (upload/delete) only if the authenticated user's ID matches {userId} in the path
           allow write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
     ```
   **Note:** These are example rules. Tailor them to your exact needs and test thoroughly using the Firebase console simulator.

4. Admin Role:
   - The `isAdmin` field in a user's Firestore document (`users/{uid}`) determines admin privileges.
   - **IMPORTANT:** This field should be set securely. Manually set it for your admin user(s) in the Firebase console or use a Cloud Function for role management. Client-side code should NOT be able to grant admin rights.

5. Cloud Functions (Optional but Recommended for advanced features):
   - For tasks like:
     - Sending notifications (e.g., to admin on new listing for moderation).
     - Complex data aggregation (e.g., user statistics beyond simple counts).
     - Securely managing user roles.
     - Database maintenance/cleanup.

This setup provides a real-time, scalable backend for your marketplace.
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
