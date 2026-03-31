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
  tempsAttenteEstime: number;
}

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
        // Calculate estimated wait time based on position and average wait time
        const position = queue.length + 1;
        const avgWaitTime = stats?.temps_attente_moyen || 15;
        
        // For urgent/critical patients, reduce wait time estimate
        let tempsEstime = position * avgWaitTime;
        if (selectedPriority === 'urgent') {
          tempsEstime = Math.ceil(tempsEstime * 0.5);
        } else if (selectedPriority === 'critique') {
          tempsEstime = Math.ceil(tempsEstime * 0.25);
        }
        
        const newTicket: TicketData = {
          numero: result.queue_id,
          patient: patient,
          service: service,
          priorite: selectedPriority,
          dateCreation: new Date().toISOString(),
          position: position,
          tempsAttenteEstime: tempsEstime
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

  // Generate HTML content for printing - with wait time instead of priority
  const generatePrintContent = (ticket: TicketData): string => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };
    
    const formatWaitTime = (minutes: number) => {
      if (minutes < 60) {
        return minutes + " min";
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours + "h " + mins + " min";
      }
    };
    
    return \`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket - Hopital de Kyeshero</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 20px;
      width: 300px;
      margin: 0 auto;
    }
    .ticket { 
      border: 2px solid #333;
      padding: 20px;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #333;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .header h1 {
      font-size: 18px;
      color: #1a1a1a;
    }
    .header p {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .ticket-number {
      text-align: center;
      margin: 20px 0;
    }
    .ticket-number .number {
      font-size: 56px;
      font-weight: bold;
      background: #2563eb;
      color: white;
      padding: 20px;
      border-radius: 10px;
      display: inline-block;
    }
    .ticket-number .label {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    .info {
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 14px;
    }
    .info-row .label { color: #666; }
    .info-row .value { font-weight: 600; }
    .wait-time {
      text-align: center;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      font-weight: bold;
      background: #dbeafe;
      color: #1e40af;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #333;
      padding-top: 15px;
      margin-top: 15px;
    }
    .footer p {
      font-size: 11px;
      color: #666;
      margin: 5px 0;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>HOPITAL DE KYESHERO</h1>
      <p>Centre de Santé</p>
      <p>République Démocratique du Congo</p>
    </div>
    
    <div class="ticket-number">
      <div class="number">#\${ticket.numero}</div>
      <div class="label">Numéro de passage</div>
    </div>
    
    <div class="info">
      <div class="info-row">
        <span class="label">Patient:</span>
        <span class="value">\${ticket.patient.nom} \${ticket.patient.prenom}</span>
      </div>
      <div class="info-row">
        <span class="label">Service:</span>
        <span class="value">\${ticket.service.nom}</span>
      </div>
      <div class="info-row">
        <span class="label">Date:</span>
        <span class="value">\${formatDate(ticket.dateCreation)}</span>
      </div>
      <div class="info-row">
        <span class="label">Heure:</span>
        <span class="value">\${formatTime(ticket.dateCreation)}</span>
      </div>
      <div class="info-row">
        <span class="label">Position:</span>
        <span class="value">\${ticket.position} patient(s)</span>
      </div>
    </div>
    
    <div class="wait-time">
      ⏱️ Temps d'attente estimé: \${formatWaitTime(ticket.tempsAttenteEstime)}
    </div>
    
    <div class="footer">
      <p>Merci de patienter</p>
      <p>Vous serez appelé à l'écran</p>
    </div>
  </div>
</body>
</html>\`;
  };

  const handlePrint = () => {
    if (!ticketData) return;
    
    const printContent = generatePrintContent(ticketData);
    const printWindow = window.open('', '_blank', 'width=350,height=600,scrollbars=yes');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
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

  const formatTimeDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatWaitTimeDisplay = (minutes: number) => {
    if (minutes < 60) {
      return minutes + " min";
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours + "h " + mins + " min";
    }
  };

  const calculateWaitTime = (dateCreation: string) => {
    const created = new Date(dateCreation);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  // Ticket Component - Display with wait time instead of priority
  const Ticket = () => {
    if (!ticketData) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">HOPITAL DE KYESHERO</h2>
            <p className="text-sm text-gray-600">Centre de Santé</p>
            <p className="text-xs text-gray-500">République Démocratique du Congo</p>
          </div>

          {/* Ticket Number */}
          <div className="text-center mb-6">
            <div className="bg-blue-600 text-white rounded-lg p-4 inline-block">
              <div className="text-4xl font-bold">#{ticketData.numero}</div>
              <div className="text-sm">Numéro de passage</div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Patient:</div>
              <div className="font-medium">{ticketData.patient.nom} {ticketData.patient.prenom}</div>
              
              <div className="text-gray-600">Service:</div>
              <div className="font-medium">{ticketData.service.nom}</div>
              
              <div className="text-gray-600">Date:</div>
              <div className="font-medium">{formatDateDisplay(ticketData.dateCreation)}</div>
              
              <div className="text-gray-600">Heure:</div>
              <div className="font-medium">{formatTimeDisplay(ticketData.dateCreation)}</div>
              
              <div className="text-gray-600">Position:</div>
              <div className="font-medium">{ticketData.position} patient(s) devant</div>
            </div>
          </div>

          {/* Wait Time instead of Priority */}
          <div className="text-center py-3 rounded-lg mb-4 bg-blue-50 border border-blue-200">
            <span className="text-lg font-bold text-blue-700">
              ⏱️ Temps d'attente estimé: {formatWaitTimeDisplay(ticketData.tempsAttenteEstime)}
            </span>
          </div>

          {/* Footer */}
          <div className="text-center border-t-2 border-dashed border-gray-300 pt-4">
            <p className="text-xs text-gray-500">Merci de patienter</p>
            <p className="text-xs text-gray-400">Vous serez appelé par SMS ou à l'écran</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
            >
              🖨️ Imprimer le ticket
            </button>
            <button
              onClick={handleCloseTicket}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-md font-medium"
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
                    Appele a {currentPatient.date_appel ? formatTimeDisplay(currentPatient.date_appel) : '--:--'}
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
                        En attente depuis {formatTimeDisplay(item.date_creation)} ({calculateWaitTime(item.date_creation)} min)
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