import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PatientManagement from './PatientManagement';
import QueueManagement from './QueueManagement';
import QueueHistory from './QueueHistory';
import Statistics from './Statistics';
import UserValidation from './UserValidation';
import ServiceManagement from './ServiceManagement';
import UserManagement from './UserManagement';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('patients');

  const tabs = [
    { id: 'patients', label: 'Gestion Patients', roles: ['admin', 'agent','medecin'] },
    { id: 'queue', label: 'File d\'Attente', roles: ['admin', 'medecin'] },
    { id: 'queue_agent', label: 'Gestion File', roles: ['agent'] },
    { id: 'history', label: 'Historique', roles: ['admin', 'agent', 'medecin'] },
    { id: 'stats', label: 'Statistiques', roles: ['admin', 'agent', 'medecin'] },
    { id: 'validation', label: 'Validation Comptes', roles: ['admin'] },
    { id: 'services', label: 'Services', roles: ['admin'] },
    { id: 'users', label: 'Utilisateurs', roles: ['admin'] },
  ];

  const filteredTabs = tabs.filter(tab => user && tab.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion Files d'Attente - Hôpital de Kyeshero
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Connecté en tant que {user?.nom} ({user?.role})
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {filteredTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'patients' && <PatientManagement />}
          {activeTab === 'queue' && <QueueManagement />}
          {activeTab === 'queue_agent' && <QueueManagement isAgentView={true} />}
          {activeTab === 'history' && <QueueHistory />}
          {activeTab === 'stats' && <Statistics />}
          {activeTab === 'validation' && <UserValidation />}
          {activeTab === 'services' && <ServiceManagement />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
};


export default Dashboard;