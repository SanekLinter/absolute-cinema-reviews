import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '../api/types';
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth';
import { Spinner } from '../components/Spinner';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const register = async (username: string, password: string) => {
    const { token } = await apiRegister(username, password);
    localStorage.setItem('token', token);

    const user = await getMe();
    setUser(user);
    setIsAuthenticated(true);
  };

  const login = async (username: string, password: string) => {
    const { token } = await apiLogin(username, password);
    localStorage.setItem('token', token);

    const user = await getMe();
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await getMe();
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, register, login, logout }}>
      {loading ? <Spinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useMe = () => {
  const { user } = useAuth();
  return user;
};
