import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

const UserValidation: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await authAPI.getPendingUsers();
      setPendingUsers(users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: number) => {
    try {
      await authAPI.validateUser(id);
      setMessage('Compte validé avec succès');
      loadPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await authAPI.rejectUser(id);
      setMessage('Compte rejeté');
      loadPendingUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du rejet');
    }
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Validation des Comptes</h2>

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

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Comptes en attente de validation ({pendingUsers.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun compte en attente de validation</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pendingUsers.map((user) => (
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
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleValidate(user.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions :</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Vérifiez les informations de chaque demandeur avant validation</li>
          <li>• Validez le compte pour permettre à l'utilisateur de se connecter</li>
          <li>• Rejetez le compte si les informations sont incorrectes ou suspectes</li>
        </ul>
      </div>
    </div>
  );
};

export default UserValidation;
