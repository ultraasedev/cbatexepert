// lib/auth.ts
'use client';

import { useState, useEffect , useRef } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name: string;
  avatar?: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

interface AuthReturn {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateEmail: (newEmail: string) => Promise<User>;
  updateProfilePicture: (newPicture: File) => Promise<User>;
  getAllUsers: () => Promise<User[]>;
  getAuthHeaders: () => { Authorization: string };
  requireAuth: (callback: () => void) => void;
  requireAdmin: (callback: () => void) => void;
}

export function useAuth(): AuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const refreshToken = async (currentToken: string) => {
    try {
      console.log('Tentative de rafraîchissement du token...');
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          action: 'refresh-token'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Token rafraîchi avec succès');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return true;
      }
      
      console.log('Échec du rafraîchissement du token', data);
      return false;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      return false;
    }
  };

  const REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
const lastTokenCheck = useRef<number>(0);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Décodage du token pour vérifier sa validité
          const decodedToken = jwt.decode(storedToken) as any;
          if (!decodedToken) throw new Error('Token invalide');

          const expirationTime = decodedToken.exp * 1000; // Conversion en ms
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;

          console.log('Temps restant avant expiration:', timeUntilExpiry / 1000 / 60, 'minutes');

              // Vérifier si le token expire dans moins de 24h et si on n'a pas déjà vérifié récemment
        if (timeUntilExpiry < REFRESH_THRESHOLD && 
            (currentTime - lastTokenCheck.current) > (60 * 60 * 1000)) { // Vérifier max une fois par heure
          lastTokenCheck.current = currentTime;
          const refreshed = await refreshToken(storedToken);
          if (!refreshed) {
            throw new Error('Échec du rafraîchissement du token');
          }
        } else {
          const userData = JSON.parse(localStorage.getItem('user') || '');
          setUser(userData);
          setToken(storedToken);
        }

          // Redirection si sur la page login
          if (window.location.pathname === '/login') {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } else if (window.location.pathname !== '/login') {
        router.push('/login');
      }
      setLoading(false);
    };

    checkAuth();
    
    // Vérification périodique du token toutes les heures
    const tokenCheckInterval = setInterval(() => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const decodedToken = jwt.decode(storedToken) as any;
        if (decodedToken) {
          const timeUntilExpiry = (decodedToken.exp * 1000) - Date.now();
          if (timeUntilExpiry < 24 * 60 * 60 * 1000) {
            refreshToken(storedToken);
          }
        }
      }
    }, 60 * 60 * 1000); // Toutes les heures

    return () => clearInterval(tokenCheckInterval);
  }, [router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Tentative de connexion:', { email });
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();
      console.log('Réponse serveur:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Échec de la connexion');
      }

      // Stockage du token et des données utilisateur
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      console.log('Connexion réussie, redirection...');
      router.push('/dashboard');

    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      throw new Error(error.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const updateEmail = async (newEmail: string): Promise<User> => {
    if (!user || !token) throw new Error('Aucun utilisateur connecté');

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'changeEmail',
          newEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour de l\'email échouée');
      }

      const updatedUser = { ...user, email: newEmail };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error('Erreur mise à jour email:', error);
      throw error;
    }
  };

  const updateProfilePicture = async (newPicture: File): Promise<User> => {
    if (!user || !token) throw new Error('Aucun utilisateur connecté');

    try {
      const formData = new FormData();
      formData.append('avatar', newPicture);

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'updateProfile',
          avatar: formData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Mise à jour de l\'avatar échouée');
      }

      const updatedUser = { ...user, avatar: data.avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error('Erreur mise à jour avatar:', error);
      throw error;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    if (!token || user?.role !== 'admin') {
      throw new Error('Non autorisé');
    }

    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Récupération des utilisateurs échouée');
      }

      return data.data;
    } catch (error: any) {
      console.error('Erreur récupération utilisateurs:', error);
      throw error;
    }
  };

  const requireAuth = (callback: () => void) => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (!loading && user) {
      callback();
    }
  };

  const requireAdmin = (callback: () => void) => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
      return;
    }
    if (!loading && user?.role === 'admin') {
      callback();
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("Token manquant"); // Lever une erreur si le token est null
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  };
  

  return {
    user,
    loading,
    login,
    logout,
    updateEmail,
    updateProfilePicture,
    getAllUsers,
    getAuthHeaders,
    requireAuth,
    requireAdmin
  };
}

export default useAuth;