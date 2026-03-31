import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'agent' as 'admin' | 'agent' | 'medecin',
    statut_compte: 'actif' as 'en_attente' | 'actif' | 'bloque'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await authAPI.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isCreating) {
        // Créer un nouvel utilisateur
        await authAPI.register({
          nom: formData.nom,
          email: formData.email,
          mot_de_passe: formData.mot_de_passe,
          role: formData.role
        });
        setMessage('Utilisateur créé avec succès');
      } else {
        // Modifier un utilisateur existant
        if (!editingUser) {
          setError('La modification est requise');
          return;
        }
        await authAPI.updateUser(editingUser.id, {
          nom: formData.nom,
          email: formData.email,
          role: formData.role,
          statut_compte: formData.statut_compte
        });
        setMessage('Utilisateur mis à jour avec succès');
      }
      setShowForm(false);
      setIsCreating(false);
      setEditingUser(null);
      setFormData({ nom: '', email: '', mot_de_passe: '', role: 'agent', statut_compte: 'actif' });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || (isCreating ? 'Erreur lors de la création' : 'Erreur lors de la mise à jour'));
    }
  };

  const handleEdit = (user: User) => {
    setIsCreating(false);
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      mot_de_passe: '',
      role: user.role,
      statut_compte: user.statut_compte || 'actif'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await authAPI.deleteUser(id);
      setMessage('Utilisateur supprimé avec succès');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsCreating(false);
    setEditingUser(null);
    setFormData({ nom: '', email: '', mot_de_passe: '', role: 'agent', statut_compte: 'actif' });
  };

  const handleAddNew = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({ nom: '', email: '', mot_de_passe: '', role: 'agent', statut_compte: 'actif' });
    setShowForm(true);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'agent': return 'Agent d\'accueil';
      case 'medecin': return 'Médecin';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'medecin': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string | undefined) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'bloque': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          + Ajouter un utilisateur
        </button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Formulaire de modification */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isCreating ? 'Ajouter un utilisateur' : 'Modifier l\'Utilisateur'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                id="nom"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {isCreating && (
              <div>
                <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  id="mot_de_passe"
                  required={isCreating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
                />
              </div>
            )}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                id="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'agent' | 'medecin' })}
              >
                <option value="admin">Administrateur</option>
                <option value="agent">Agent d'accueil</option>
                <option value="medecin">Médecin</option>
              </select>
            </div>
            <div>
              <label htmlFor="statut_compte" className="block text-sm font-medium text-gray-700 mb-1">
                Statut du compte *
              </label>
              <select
                id="statut_compte"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.statut_compte}
                onChange={(e) => setFormData({ ...formData, statut_compte: e.target.value as 'en_attente' | 'actif' | 'bloque' })}
              >
                <option value="actif">Actif</option>
                <option value="en_attente">En attente</option>
                <option value="bloque">Bloqué</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {isCreating ? 'Créer l\'utilisateur' : 'Mettre à jour'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des utilisateurs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Liste des Utilisateurs ({users.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun utilisateur disponible</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.nom}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.statut_compte)}`}>
                        {user.statut_compte || 'en_attente'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
