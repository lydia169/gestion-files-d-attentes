import React, { useState, useEffect } from 'react';
import { QueueStats, Service } from '../types';
import { queueAPI } from '../services/api';

const Statistics: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<{ [key: number]: QueueStats }>({});
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      loadAllStats();
    }
  }, [services]);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/public/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const statsData: { [key: number]: QueueStats } = {};
      for (const service of services) {
        try {
          const serviceStats = await queueAPI.getStats(service.id);
          statsData[service.id] = serviceStats;
        } catch (error) {
          console.error(`Erreur stats service ${service.id}:`, error);
          statsData[service.id] = {
            en_attente: 0,
            en_cours: 0,
            servis_aujourdhui: 0,
            temps_attente_moyen: 0,
          };
        }
      }
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPatients = Object.values(stats).reduce((sum, serviceStats) =>
    sum + serviceStats.en_attente + serviceStats.en_cours + serviceStats.servis_aujourdhui, 0
  );

  const averageWaitTime = Object.values(stats).length > 0
    ? Object.values(stats).reduce((sum, serviceStats) => sum + serviceStats.temps_attente_moyen, 0) / Object.values(stats).length
    : 0;

  const totalServedToday = Object.values(stats).reduce((sum, serviceStats) =>
    sum + serviceStats.servis_aujourdhui, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Statistiques</h2>
        <button
          onClick={loadAllStats}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">Σ</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients Aujourd'hui
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalPatients}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Patients Servis Aujourd'hui
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalServedToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏱</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Temps d'Attente Moyen
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {averageWaitTime.toFixed(1)} min
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Stats */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Statistiques par Service</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {services.map((service) => {
            const serviceStats = stats[service.id];
            if (!serviceStats) return null;

            return (
              <li key={service.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{service.nom}</h4>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">{serviceStats.en_attente}</div>
                      <div className="text-xs text-gray-500">En attente</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{serviceStats.en_cours}</div>
                      <div className="text-xs text-gray-500">En cours</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">{serviceStats.servis_aujourdhui}</div>
                      <div className="text-xs text-gray-500">Servis</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-orange-600">{serviceStats.temps_attente_moyen} min</div>
                      <div className="text-xs text-gray-500">Attente moy.</div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Simple Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par Service</h3>
          <div className="space-y-3">
            {services.map((service) => {
              const serviceStats = stats[service.id];
              if (!serviceStats) return null;
              const total = serviceStats.en_attente + serviceStats.en_cours + serviceStats.servis_aujourdhui;
              const percentage = totalPatients > 0 ? (total / totalPatients) * 100 : 0;

              return (
                <div key={service.id} className="flex items-center">
                  <div className="w-32 text-sm text-gray-600 truncate">{service.nom}</div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600 text-right">{total}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">État des Files d'Attente</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">En attente</span>
              <span className="text-lg font-semibold text-blue-600">
                {Object.values(stats).reduce((sum, s) => sum + s.en_attente, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">En cours</span>
              <span className="text-lg font-semibold text-green-600">
                {Object.values(stats).reduce((sum, s) => sum + s.en_cours, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servis aujourd'hui</span>
              <span className="text-lg font-semibold text-purple-600">
                {Object.values(stats).reduce((sum, s) => sum + s.servis_aujourdhui, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;