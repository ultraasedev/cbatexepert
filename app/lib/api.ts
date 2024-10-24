// lib/api.ts

import { ExpertisePlan, User, PDA } from '../types'; // Assurez-vous que ces types sont définis dans votre dossier types

const API_BASE_URL = '/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { info: any, status: number };
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (): Promise<void> => {
    return fetchAPI('/auth/logout', { method: 'POST' });
  },

  getCurrentUser: async (): Promise<User> => {
    return fetchAPI('/auth/me');
  },
};

export const expertisePlansAPI = {
  getAll: async (): Promise<ExpertisePlan[]> => {
    return fetchAPI('/expertise-plans');
  },

  getById: async (id: string): Promise<ExpertisePlan> => {
    return fetchAPI(`/expertise-plans/${id}`);
  },

  create: async (planData: Omit<ExpertisePlan, 'id' | 'createdAt'>): Promise<ExpertisePlan> => {
    return fetchAPI('/expertise-plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  },

  update: async (id: string, planData: Partial<ExpertisePlan>): Promise<ExpertisePlan> => {
    return fetchAPI(`/expertise-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI(`/expertise-plans/${id}`, { method: 'DELETE' });
  },
};

export const pdaAPI = {
  getAll: async (): Promise<PDA[]> => {
    return fetchAPI('/pda');
  },

  getById: async (id: string): Promise<PDA> => {
    return fetchAPI(`/pda/${id}`);
  },

  create: async (pdaData: Omit<PDA, 'id' | 'createdAt'>): Promise<PDA> => {
    return fetchAPI('/pda', {
      method: 'POST',
      body: JSON.stringify(pdaData),
    });
  },

  update: async (id: string, pdaData: Partial<PDA>): Promise<PDA> => {
    return fetchAPI(`/pda/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pdaData),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI(`/pda/${id}`, { method: 'DELETE' });
  },
};

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    return fetchAPI('/users');
  },

  create: async (userData: Omit<User, 'id'>): Promise<User> => {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: Partial<User>): Promise<User> => {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },
};