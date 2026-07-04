import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);

  useEffect(() => {
    const t = localStorage.getItem('pt_token') || sessionStorage.getItem('pt_token');
    const u = localStorage.getItem('pt_user') || sessionStorage.getItem('pt_user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  function login(userData, authToken, remember = true) {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('pt_token', authToken);
    storage.setItem('pt_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_user');
    sessionStorage.removeItem('pt_token');
    sessionStorage.removeItem('pt_user');
    setToken(null);
    setUser(null);
  }

  logoutRef.current = logout;

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          if (!url.includes('/api/auth/')) {
            logoutRef.current();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptorId);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
