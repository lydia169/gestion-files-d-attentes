import React, { useState, useEffect, useCallback } from 'react';
import { Service, QueueItem } from '../types';
import { queueAPI, servicesAPI } from '../services/api';

const QueueHistory: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [history, setHistory] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('today');

  const loadServices = useCallback(async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data);
      if (data.length > 0) {
        setSelectedService(data[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!selectedService) return;
    setLoading(true);
    try {
      const data = await queueAPI.getHistory(selectedService);
      
      // Filter based on date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      let filteredData = data;
      
      if (filter === 'today') {
        filteredData = data.filter((item: QueueItem) => {
          const itemDate = item.date_appel ? new Date(item.date_appel) : new Date(item.date_creation);
          return itemDate >= today;
        });
      } else if (filter === 'week') {
        filteredData = data.filter((item: QueueItem) => {
          const itemDate = item.date_appel ? new Date(item.date_appel) : new Date(item.date_creation);
          return itemDate >= weekAgo;
        });
      } else if (filter === 'month') {
        filteredData = data.filter((item: QueueItem) => {
          const itemDate = item.date_appel ? new Date(item.date_appel) : new Date(item.date_creation);
          return itemDate >= monthStart;
        });
      }
      
      setHistory(filteredData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedService, filter]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (selectedService) {
      loadHistory();
    }
  }, [selectedService, filter, loadHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    
    if (minutes < 60) {
      return minutes + ' min';
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours + 'h ' + mins + ' min';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historique des Patients</h2>
        <select
          value={selectedService || ''}
          onChange={(e) => setSelectedService(Number(e.target.value))}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {services.map(service => (
            <option key={service.id} value={service.id}>{service.nom}</option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'today' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'week' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Cette semaine
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ce mois
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Tout
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{history.length}</div>
          <div className="text-sm text-gray-500">Patients servis</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {history.length > 0 
              ? Math.round(history.reduce((sum: number, item: QueueItem) => {
                  const duration = item.date_fin 
                    ? Math.floor((new Date(item.date_fin).getTime() - new Date(item.date_creation).getTime()) / 60000)
                    : 0;
                  return sum + duration;
                }, 0) / history.length)
              : 0} min
          </div>
          <div className="text-sm text-gray-500">Durée moyenne</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {history.filter((h: QueueItem) => h.statut === 'absent').length}
          </div>
          <div className="text-sm text-gray-500">Patients absents</div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Historique ({history.length} patients)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date arrival
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure arrival
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heure de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Aucun patient dans l'historique
                  </td>
                </tr>
              ) : (
                history.map((item: QueueItem) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">#{item.numero}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.nom} {item.prenom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.date_creation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(item.date_creation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.date_fin ? formatTime(item.date_fin) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateDuration(item.date_creation, item.date_fin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.statut === 'termine' 
                          ? 'bg-green-100 text-green-800' 
                          : item.statut === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.statut === 'termine' ? 'Terminé' : item.statut === 'absent' ? 'Absent' : item.statut}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QueueHistory;