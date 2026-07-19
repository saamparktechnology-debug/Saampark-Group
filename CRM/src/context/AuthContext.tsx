"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define what a User looks like
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Login Logic
  const login = async (username: string, password: string): Promise<boolean> => {
    const mockUsers: Record<string, User> = {
      admin: { id: '1', username: 'admin', email: 'admin@shop.com', role: 'admin' },
      manager: { id: '2', username: 'manager', email: 'manager@shop.com', role: 'manager' },
      staff: { id: '3', username: 'staff', email: 'staff@shop.com', role: 'staff' },
    };

    const foundUser = mockUsers[username.toLowerCase()];
    if (foundUser && password === `${username}123`) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      canEdit: user?.role === 'admin' || user?.role === 'manager'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}