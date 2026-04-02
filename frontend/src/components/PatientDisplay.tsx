import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QueueItem, Service } from '../types';
import { queueAPI } from '../services/api';

const PatientDisplay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const serviceFilter = searchParams.get('service');
  const [services, setServices] = useState<Service[]>([]);
  const [currentPatients, setCurrentPatients] = useState<{ [key: number]: QueueItem | null }>({});
  const [queues, setQueues] = useState<{ [key: number]: QueueItem[] }>({});

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch('/api/public/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    const currents: { [key: number]: QueueItem | null } = {};
    const queueData: { [key: number]: QueueItem[] } = {};

    for (const service of services) {
      try {
        const current = await queueAPI.getCurrentPatient(service.id);
        currents[service.id] = current;

        const queue = await queueAPI.getQueueByService(service.id);
        queueData[service.id] = queue.slice(0, 3); // Show next 3 patients
      } catch (error) {
        console.error(`Erreur pour service ${service.id}:`, error);
        currents[service.id] = null;
        queueData[service.id] = [];
      }
    }

    setCurrentPatients(currents);
    setQueues(queueData);
  }, [services]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (services.length > 0) {
      loadAllData();
      const interval = setInterval(loadAllData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [services, loadAllData]);

  const filteredServices = serviceFilter ? services.filter(s => s.id === Number(serviceFilter)) : services;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Écran d'Information Patient
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
                {service.nom}
              </h2>

              {/* Current Patient */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Patient Actuel</h3>
                {currentPatients[service.id] ? (
                  <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 text-center">
                    <div className="text-6xl font-bold text-green-600 mb-2">
                      #{currentPatients[service.id]!.numero}
                    </div>
                    <div className="text-xl font-semibold text-gray-800">
                      {currentPatients[service.id]!.nom} {currentPatients[service.id]!.prenom}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                    <div className="text-4xl font-bold text-gray-400 mb-2">---</div>
                    <div className="text-lg text-gray-500">Aucun patient</div>
                  </div>
                )}
              </div>

              {/* Next Patients */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Prochains Patients</h3>
                <div className="space-y-2">
                  {queues[service.id]?.slice(0, 3).map((patient, index) => (
                    <div key={patient.id} className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        #{patient.numero}
                      </div>
                      <div className="text-sm text-gray-600">
                        {patient.nom} {patient.prenom}
                      </div>
                    </div>
                  ))}
                  {(!queues[service.id] || queues[service.id].length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                      File vide
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDisplay;