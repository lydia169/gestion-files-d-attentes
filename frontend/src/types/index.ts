export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'admin' | 'agent' | 'medecin';
  statut_compte?: 'en_attente' | 'actif' | 'bloque';
  created_at: string;
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone?: string;
  adresse?: string;
  created_at: string;
}

export interface Service {
  id: number;
  nom: string;
  description?: string;
}

export interface QueueItem {
  id: number;
  patient_id: number;
  service_id: number;
  numero: number;
  priorite: 'normal' | 'urgent' | 'critique';
  statut: 'en_attente' | 'en_cours' | 'termine' | 'absent';
  date_creation: string;
  date_appel?: string;
  date_fin?: string;
  utilisateur_appel_id?: number;
  // Jointures
  nom: string;
  prenom: string;
  telephone?: string;
  temps_attente_minutes?: number;
}

export interface QueueStats {
  en_attente: number;
  en_cours: number;
  servis_aujourdhui: number;
  temps_attente_moyen: number;
}

export interface LoginData {
  email: string;
  mot_de_passe: string;
}

export interface RegisterData {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: 'admin' | 'agent' | 'medecin';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}
