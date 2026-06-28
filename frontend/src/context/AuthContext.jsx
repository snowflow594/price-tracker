import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
