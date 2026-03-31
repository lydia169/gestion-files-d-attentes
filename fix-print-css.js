const fs = require('fs');
const path = require('path');

const content = `import React, { useState, useEffect } from 'react';
import { Service, QueueItem, QueueStats, Patient } from '../types';
import { queueAPI, servicesAPI, patientsAPI } from '../services/api';

interface TicketData {
  numero: number;
  patient: Patient;
  service: Service;
  priorite: string;
  dateCreation: string;
  position: number;
}

interface QueueManagementProps {
  isAgentView?: boolean;
}

// CSS for printing - injected into the page
const printStyles = \`
  @media print {
    body > *:not(.print-container) {
      display: none !important;
    }
    .print-container {
      display: block !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: white !important;
      z-index: 9999 !important;
      overflow: visible !important;
    }
    .print-container > div {
      display: block !important;
    }
    .no-print {
      display: none !important;
    }
  }
\`;

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
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

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
      
      const patient = patients.find(p => p.id === selectedPatientId);
      const service = services.find(s => s.id === selectedService);
      
      if (patient && service) {
        const newTicket: TicketData = {
          numero: result.queue_id,
          patient: patient,
          service: service,
          priorite: selectedPriority,
          dateCreation: new Date().toISOString(),
          position: queue.length + 1
        };
        setTicketData(newTicket);
        setShowTicket(true);
      }
      
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

  const handlePrint = () => {
    // Use the browser's print function
    window.print();
  };

  const handleCloseTicket = () => {
    setShowTicket(false);
    setTicketData(null);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const calculateWaitTime = (dateCreation: string) => {
    const created = new Date(dateCreation);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  // Ticket Component with inline styles for print
  const Ticket = () => {
    if (!ticketData) return null;
    
    const ticketStyle = {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      maxWidth: '400px',
      margin: '0 auto',
    };
    
    const headerStyle = {
      textAlign: 'center' as const,
      borderBottom: '2px dashed #333',
      paddingBottom: '15px',
      marginBottom: '15px',
    };
    
    const numberStyle = {
      textAlign: 'center' as const,
      margin: '20px 0',
    };
    
    const infoRowStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '8px 0',
      fontSize: '14px',
    };
    
    const labelStyle = {
      color: '#666',
    };
    
    const valueStyle = {
      fontWeight: 'bold' as const,
    };
    
    const footerStyle = {
      textAlign: 'center' as const,
      borderTop: '2px dashed #333',
      paddingTop: '15px',
      marginTop: '15px',
    };
    
    const priorityStyle = ticketData.priorite === 'critique' 
      ? { backgroundColor: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '5px', textAlign: 'center' as const, margin: '15px 0', fontWeight: 'bold' as const }
      : ticketData.priorite === 'urgent'
      ? { backgroundColor: '#ffedd5', color: '#9a3412', padding: '10px', borderRadius: '5px', textAlign: 'center' as const, margin: '15px 0', fontWeight: 'bold' as const }
      : { display: 'none' };
    
    return (
      <div className="print-container" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={ticketStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>HOPITAL DE KYESHERO</h2>
            <p style={{ fontSize: '14px', margin: '5px 0 0 0', color: '#666' }}>Centre de Santé</p>
            <p style={{ fontSize: '12px', color: '#999' }}>République Démocratique du Congo</p>
          </div>

          {/* Ticket Number */}
          <div style={numberStyle}>
            <div style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              padding: '15px 25px', 
              borderRadius: '8px', 
              display: 'inline-block',
              fontSize: '48px',
              fontWeight: 'bold',
            }}>
              #{ticketData.numero}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Numéro de passage</div>
          </div>

          {/* Patient Info */}
          <div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Patient:</span>
              <span style={valueStyle}>{ticketData.patient.nom} {ticketData.patient.prenom}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Service:</span>
              <span style={valueStyle}>{ticketData.service.nom}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Priorité:</span>
              <span style={valueStyle}>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '12px',
                  backgroundColor: ticketData.priorite === 'critique' ? '#fee2e2' : ticketData.priorite === 'urgent' ? '#ffedd5' : '#dbeafe',
                  color: ticketData.priorite === 'critique' ? '#991b1b' : ticketData.priorite === 'urgent' ? '#9a3412' : '#1e40af',
                }}>
                  {getPriorityLabel(ticketData.priorite)}
                </span>
              </span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Date:</span>
              <span style={valueStyle}>{formatDate(ticketData.dateCreation)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Heure:</span>
              <span style={valueStyle}>{formatTime(ticketData.dateCreation)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Position:</span>
              <span style={valueStyle}>{ticketData.position} patient(s)</span>
            </div>
          </div>

          {/* Priority indicator */}
          {ticketData.priorite !== 'normal' && (
            <div style={priorityStyle}>
              {ticketData.priorite === 'critique' ? '⚠️ PRIORITÉ CRITIQUE' : '⚡ PRIORITÉ URGENTE'}
            </div>
          )}

          {/* Footer */}
          <div style={footerStyle}>
            <p style={{ fontSize: '11px', color: '#666', margin: '5px 0' }}>Merci de patienter</p>
            <p style={{ fontSize: '11px', color: '#999', margin: '5px 0' }}>Vous serez appelé à l'écran</p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              🖨️ Imprimer le ticket
            </button>
            <button
              onClick={handleCloseTicket}
              style={{
                backgroundColor: '#d1d5db',
                color: '#374151',
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Inject print styles */}
      <style>{printStyles}</style>

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

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40">
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

      {/* Ticket Modal */}
      {showTicket && <Ticket />}
    </div>
  );
};

export default QueueManagement;
`;

const filePath = path.join(__dirname, 'frontend', 'src', 'components', 'QueueManagement.tsx');
fs.writeFileSync(filePath, content, 'utf8');
console.log('File written successfully to:', filePath);
console.log('File size:', content.length, 'bytes');