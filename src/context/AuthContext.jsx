import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('boltrain_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    localStorage.setItem('boltrain_user', JSON.stringify(data.user));
    localStorage.setItem('boltrain_token', data.token);
    return data;
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    setUser(data.user);
    localStorage.setItem('boltrain_user', JSON.stringify(data.user));
    localStorage.setItem('boltrain_token', data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('boltrain_user');
    localStorage.removeItem('boltrain_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
