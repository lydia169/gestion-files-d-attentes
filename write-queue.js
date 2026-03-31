const fs = require('fs');
const content = `import React, { useState, useEffect } from 'react';
import { Service, QueueItem, QueueStats, Patient } from '../types';
import { queueAPI, servicesAPI, patientsAPI } from '../services/api';

interface QueueManagementProps {
  isAgentView?: boolean;
}

const QueueManagement: React.FC<QueueManagementProps> = ({ isAgentView = false }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'normal' | 'urgent' | 'critique'>('normal');

  useEffect(() => {
    loadServices();
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadQueue();
      loadCurrentPatient();
      loadStats();
      const interval = setInterval(() => {
        loadQueue();
        loadCurrentPatient();
        loadStats();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedService]);

  const loadServices = async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data);
      if (data.length > 0 && !selectedService) {
        setSelectedService(data[0].id);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await patientsAPI.getAll();
      setPatients(data);
    } catch (error) {
      console.error("Erreur lors du chargement des patients:", error);
    }
  };

  const loadQueue = async () => {
    if (!selectedService) return;
    setLoading(true);
    try {
      const data = await queueAPI.getQueueByService(selectedService);
      setQueue(data);
    } catch (error) {
      console.error("Erreur lors du chargement de la file:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentPatient = async () => {
    if (!selectedService) return;
    try {
      const data = await queueAPI.getCurrentPatient(selectedService);
      setCurrentPatient(data);
    } catch (error) {
      console.error("Erreur lors du chargement du patient actuel:", error);
    }
  };

  const loadStats = async () => {
    if (!selectedService) return;
    try {
      const data = await queueAPI.getStats(selectedService);
      setStats(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const handleCallNext = async () => {
    if (!selectedService) return;
    setActionLoading(true);
    try {
      const result = await queueAPI.callNextPatient(selectedService);
      setCurrentPatient(result.current_patient);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error("Erreur lors de l'appel du patient:", error);
      alert("Erreur lors de l'appel du patient");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (queueId: number) => {
    setActionLoading(true);
    try {
      await queueAPI.completePatient(queueId);
      setCurrentPatient(null);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
      alert("Erreur lors de la finalisation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbsent = async (queueId: number) => {
    setActionLoading(true);
    try {
      await queueAPI.markAbsent(queueId);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error("Erreur lors du marquage absent:", error);
      alert("Erreur lors du marquage absent");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPatientToQueue = async () => {
    if (!selectedPatientId || !selectedService) return;
    setActionLoading(true);
    try {
      const result = await queueAPI.addToQueue({
        patient_id: selectedPatientId,
        service_id: selectedService,
        priorite: selectedPriority
      });
      alert("Patient ajoute a la file. Numero: " + result.queue_id);
      setShowAddModal(false);
      setSelectedPatientId(null);
      setSelectedPriority('normal');
      loadQueue();
      loadStats();
    } catch (error) {
      console.error("Erreur lors de l'ajout a la file:", error);
      alert("Erreur lors de l'ajout a la file");
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityLabel = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'Critique';
      case 'urgent': return 'Urgent';
      default: return 'Normal';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateWaitTime = (dateCreation: string) => {
    const created = new Date(dateCreation);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAgentView ? "Gestion de la File d'Attente" : "File d'Attente"}
        </h2>
        <div className="flex space-x-4">
          <select
            value={selectedService || ''}
            onChange={(e) => setSelectedService(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {services.map(service => (
              <option key={service.id} value={service.id}>{service.nom}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            + Ajouter Patient
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.en_attente}</div>
            <div className="text-sm text-gray-500">En attente</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.en_cours}</div>
            <div className="text-sm text-gray-500">En cours</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{stats.servis_aujourdhui}</div>
            <div className="text-sm text-gray-500">Servis aujourd'hui</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.temps_attente_moyen} min</div>
            <div className="text-sm text-gray-500">Temps d'attente moyen</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Patient en cours</h3>
        </div>
        <div className="p-4">
          {currentPatient ? (
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-full p-4">
                  <span className="text-2xl font-bold text-green-600">#{currentPatient.numero}</span>
                </div>
                <div>
                  <div className="text-lg font-medium">{currentPatient.nom} {currentPatient.prenom}</div>
                  <div className="text-sm text-gray-500">
                    Appele a {currentPatient.date_appel ? formatTime(currentPatient.date_appel) : '--:--'}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleComplete(currentPatient.id)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Terminer
                </button>
                <button
                  onClick={() => handleAbsent(currentPatient.id)}
                  disabled={actionLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Absent
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">Aucun patient en cours</div>
          )}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleCallNext}
              disabled={actionLoading || !selectedService}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Chargement...' : 'Appeler le prochain patient'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Patients en attente ({queue.length})</h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Chargement...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Aucun patient dans la file d'attente</div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="font-bold text-gray-600">#{item.numero}</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.nom} {item.prenom}</div>
                      <div className="text-sm text-gray-500">
                        En attente depuis {formatTime(item.date_creation)} ({calculateWaitTime(item.date_creation)} min)
                      </div>
                    </div>
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getPriorityColor(item.priorite)}>
                      {getPriorityLabel(item.priorite)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter un patient a la file</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Selectionner un patient</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>{patient.nom} {patient.prenom}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorite</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as 'normal' | 'urgent' | 'critique')}
                  className="w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddPatientToQueue}
                  disabled={!selectedPatientId || actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;`;

fs.writeFileSync('frontend/src/components/QueueManagement.tsx', content);
console.log('File written successfully');