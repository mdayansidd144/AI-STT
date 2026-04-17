import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (email: string, username: string, password: string, full_name: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on mount
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Set token in API headers
      api.setAuthToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(username, password);
      if (response.access_token) {
        setToken(response.access_token);
        setUser(response.user);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        api.setAuthToken(response.access_token);
        toast.success('Login successful!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
      return false;
    }
  };

  const signup = async (email: string, username: string, password: string, full_name: string): Promise<boolean> => {
    try {
      const response = await api.signup(email, username, password, full_name);
      if (response.access_token) {
        setToken(response.access_token);
        setUser(response.user);
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        api.setAuthToken(response.access_token);
        toast.success('Account created successfully!');
        return true;
      }
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Signup failed');
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    api.setAuthToken(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};