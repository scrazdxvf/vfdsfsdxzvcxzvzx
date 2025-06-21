
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>; // Pass is unused in mock
  logout: () => Promise<void>;
  signup: (email: string, pass: string, username: string) => Promise<void>; // Pass is unused
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users
const MOCK_USERS: { [key: string]: User } = {
  "user@example.com": { id: "user123", email: "user@example.com", username: "TestUser", isAdmin: false, city: "Киев", telegram: "@testuser" },
  "admin@example.com": { id: "admin456", email: "admin@example.com", username: "AdminBoss", isAdmin: true, city: "Львов", telegram: "@adminboss" },
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for persisted login state
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser) {
        // In a real app, you'd verify password here against a hash
        setUser(foundUser);
        localStorage.setItem('authUser', JSON.stringify(foundUser));
    } else {
        throw new Error("User not found or password incorrect");
    }
    setLoading(false);
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    localStorage.removeItem('authUser');
    setLoading(false);
  };
  
  const signup = async (email: string, pass: string, username: string): Promise<void> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (MOCK_USERS[email.toLowerCase()]) {
      setLoading(false);
      throw new Error("User already exists");
    }
    const newUser: User = { 
      id: `user-${Date.now()}`, 
      email: email.toLowerCase(), 
      username: username, 
      isAdmin: false,
      city: "Киев", // Default city
      telegram: `@${username.toLowerCase()}` // Default telegram
    };
    MOCK_USERS[email.toLowerCase()] = newUser; // Add to mock users
    setUser(newUser);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    setLoading(false);
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
    