import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as AuthUser } from 'firebase/auth'; // Firebase Auth User
import { auth, db } from '../firebase'; // Your Firebase setup
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types'; // Your app's User type

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, pass: string, username: string, city?: string, telegram?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: AuthUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in, get our custom user data from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUser({ id: firebaseUser.uid, ...userSnap.data() } as User);
        } else {
          // This case might happen if user was created but profile doc creation failed
          // Or for users authenticated via other means without a profile yet.
          // For email/password signup, we create the doc during signup.
          // Fallback or create a basic profile:
           const newUserProfile: Omit<User, 'id'> = {
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            isAdmin: false, // Default
            // city: '', // prompt user or set default
            // telegram: '', // prompt user or set default
          };
          await setDoc(userRef, { ...newUserProfile, createdAt: serverTimestamp() });
          setUser({ id: firebaseUser.uid, ...newUserProfile });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting the user state
    } catch (error) {
      setLoading(false);
      console.error("Login error: ", error);
      if (error instanceof Error) {
        throw new Error(mapAuthCodeToMessage(error.message));
      }
      throw new Error("An unknown error occurred during login.");
    }
    // setLoading(false) is handled by onAuthStateChanged
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting user to null
    } catch (error) {
       console.error("Logout error: ", error);
       if (error instanceof Error) {
        throw new Error(mapAuthCodeToMessage(error.message));
      }
      throw new Error("An unknown error occurred during logout.");
    } finally {
        setLoading(false); // Ensure loading is false even if onAuthStateChanged is slow or errors
    }
  };
  
  const signup = async (email: string, pass: string, username: string, city?: string, telegram?: string): Promise<void> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;
      
      // Create user profile in Firestore
      const newUserProfile: Omit<User, 'id' | 'email'> & {email: string} = {
        username,
        email: firebaseUser.email!, // email is guaranteed from createUserWithEmailAndPassword
        isAdmin: false, // Default, admin role should be managed securely
        city: city || '',
        telegram: telegram || '',
      };
      await setDoc(doc(db, "users", firebaseUser.uid), {
        ...newUserProfile,
        createdAt: serverTimestamp() 
      });
      // onAuthStateChanged will set the user state with this new profile
    } catch (error) {
      setLoading(false);
      console.error("Signup error: ", error);
      if (error instanceof Error) {
         throw new Error(mapAuthCodeToMessage(error.message));
      }
      throw new Error("An unknown error occurred during signup.");
    }
     // setLoading(false) is handled by onAuthStateChanged
  };

  const mapAuthCodeToMessage = (code: string): string => {
    // Firebase auth errors often come in format "auth/error-code"
    if (code.includes("auth/user-not-found")) return "Пользователь с таким email не найден.";
    if (code.includes("auth/wrong-password")) return "Неверный пароль.";
    if (code.includes("auth/email-already-in-use")) return "Этот email уже зарегистрирован.";
    if (code.includes("auth/weak-password")) return "Пароль слишком слабый. Используйте не менее 6 символов.";
    if (code.includes("auth/invalid-email")) return "Некорректный формат email.";
    // Add more specific messages as needed
    console.warn("Unhandled auth error code:", code);
    return "Произошла ошибка аутентификации.";
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
