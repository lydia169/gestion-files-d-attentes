import axios, { InternalAxiosRequestConfig } from 'axios';
import { LoginData, RegisterData, AuthResponse, RegisterResponse, User, Patient, Service, QueueItem, QueueStats } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentification
export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/all');
    return response.data;
  },

  getPendingUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/pending');
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<void> => {
    await api.put(`/auth/${id}`, data);
  },

  validateUser: async (id: number): Promise<void> => {
    await api.post(`/auth/validate/${id}`);
  },

  rejectUser: async (id: number): Promise<void> => {
    await api.post(`/auth/reject/${id}`);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/auth/${id}`);
  },
};

// Services
export const servicesAPI = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
  },

  create: async (data: Omit<Service, 'id'>): Promise<{ service_id: number }> => {
    const response = await api.post('/services', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Service>): Promise<void> => {
    await api.put(`/services/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/services/${id}`);
  },
};

// Patients
export const patientsAPI = {
  getAll: async (): Promise<Patient[]> => {
    const response = await api.get('/patients');
    return response.data;
  },

  create: async (data: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> => {
    const response = await api.post('/patients', data);
    return response.data.patient;
  },

  update: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data.patient;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/patients/${id}`);
  },

  search: async (query: string): Promise<Patient[]> => {
    const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Files d'attente
export const queueAPI = {
  addToQueue: async (data: { patient_id: number; service_id: number; priorite?: string }): Promise<{ queue_id: number; numero: number }> => {
    const response = await api.post('/queue', data);
    return response.data;
  },

  getQueueByService: async (serviceId: number): Promise<QueueItem[]> => {
    const response = await api.get(`/queue/service/${serviceId}`);
    return response.data;
  },

  getCurrentPatient: async (serviceId: number): Promise<QueueItem | null> => {
    const response = await api.get(`/queue/current/${serviceId}`);
    return response.data;
  },

  callNextPatient: async (serviceId: number): Promise<{ current_patient: QueueItem }> => {
    const response = await api.post(`/queue/call/${serviceId}`);
    return response.data;
  },

  completePatient: async (queueId: number): Promise<void> => {
    await api.post(`/queue/complete/${queueId}`);
  },

  markAbsent: async (queueId: number, delayMinutes: number = 5): Promise<{ message: string; delay_minutes: number }> => {
    const response = await api.post(`/queue/absent/${queueId}`, { delay_minutes: delayMinutes });
    return response.data;
  },

  getStats: async (serviceId: number): Promise<QueueStats> => {
    const response = await api.get(`/queue/stats/${serviceId}`);
    return response.data;
  },

  getHistory: async (serviceId: number): Promise<QueueItem[]> => {
    const response = await api.get(`/queue/history/${serviceId}`);
    return response.data;
  },
};

export default api;
