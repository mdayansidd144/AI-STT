import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  created_at?: string;
  total_transcriptions?: number;
  total_words?: number;
  avg_accuracy?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    username: string,
    password: string,
    full_name?: string
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
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

  /*
   * Restore authentication when the application starts.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token');

      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const currentUser = await api.getMe();

        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.warn('Saved session is no longer valid.');

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('email');

        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /*
   * Login using username OR email.
   */
  const login = async (
    identifier: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await api.login(identifier, password);

      if (!response?.success || !response?.access_token) {
        toast.error(response?.message || 'Login failed');
        return false;
      }

      const newToken = response.access_token;
      const newUser = response.user;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('username', newUser.username);
      localStorage.setItem('email', newUser.email);

      toast.success('Login successful!');

      return true;
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Login failed. Please check your credentials.';

      toast.error(message);

      return false;
    }
  };

  /*
   * Create a new account.
   */
  const signup = async (
    email: string,
    username: string,
    password: string,
    full_name?: string
  ): Promise<boolean> => {
    try {
      const response = await api.signup(
        email,
        username,
        password,
        full_name
      );

      if (!response?.success || !response?.access_token) {
        toast.error(response?.message || 'Account creation failed');
        return false;
      }

      const newToken = response.access_token;
      const newUser = response.user;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('username', newUser.username);
      localStorage.setItem('email', newUser.email);

      toast.success('Account created successfully!');

      return true;
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Signup failed. Please try again.';

      toast.error(message);

      return false;
    }
  };

  /*
   * Logout.
   */
  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('email');

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
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;