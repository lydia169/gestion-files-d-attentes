import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../types';
import { subscribeToPush, isPushSupported, requestNotificationPermission } from '../utils/push';

interface VerifiedPatient {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string;
}

interface TicketResponse {
  message: string;
  queue_id: number;
  numero: number;
  statut: string;
  temps_attente_estime_minutes: number;
  service?: {
    id: number;
    nom: string;
  };
}

const PatientRetrieve: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form states
  const [telephone, setTelephone] = useState('');
  const [date_naissance, setDate_naissance] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState<VerifiedPatient | null>(null);
  const [patientNotFound, setPatientNotFound] = useState(false);
  const [selectedService, setSelectedService] = useState<number>(0);
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/public/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des services:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPatientNotFound(false);
    setVerifying(true);

    try {
      const response = await fetch('/api/public/verify-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, date_naissance })
      });

      const data = await response.json();

      if (data.found) {
        setVerifiedPatient(data.patient);
      } else {
        setPatientNotFound(true);
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGetTicket = async () => {
    if (!verifiedPatient || selectedService === 0) {
      setError('Veuillez sélectionner un service');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/public/get-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: verifiedPatient.id,
          service_id: selectedService,
          priorite: 'normal'
        })
      });

      const data: TicketResponse = await response.json();

      if (response.ok) {
        setTicketData(data);
        setSubmitted(true);
        
        // S'abonner aux notifications push après l'obtention du ticket
        if (isPushSupported()) {
          try {
            const pushResult = await subscribeToPush(verifiedPatient.id, selectedService);
            if (pushResult.success) {
              console.log('Inscription aux notifications push réussie');
            } else {
              // @ts-ignore
              console.warn('Échec de l\'inscription aux notifications:', pushResult.error);
            }
          } catch (pushErr) {
            console.error('Erreur lors de l\'inscription push:', pushErr);
          }
        }
      } else {
        setError(data.message || 'Erreur lors de la récupération du numéro');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTelephone('');
    setDate_naissance('');
    setVerifiedPatient(null);
    setPatientNotFound(false);
    setSelectedService(0);
    setTicketData(null);
    setSubmitted(false);
    setError('');
  };

  // Display ticket result
  if (submitted && ticketData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                {ticketData.message}
              </h2>
              <div className="mt-8 space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-lg font-semibold text-blue-900">
                    Service: {ticketData.service?.nom}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-lg font-semibold text-green-900">
                    Votre numéro est {ticketData.numero}
                  </p>
                  <p className="text-sm text-green-700">
                    Statut: {ticketData.statut === 'en_cours' ? 'En cours' : 'En attente'}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Temps d'attente estimé: {ticketData.temps_attente_estime_minutes} minutes
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🖨️ Imprimer mon ticket
                </button>
              </div>
              {/* Zone d'impression cachée - visible uniquement lors de l'impression */}
              <div className="hidden print:block p-8 border-2 border-black rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Hôpital de Kyeshero</h2>
                <p className="text-6xl font-bold mb-4">N° {ticketData.numero}</p>
                <p className="text-xl mb-2">Service: {ticketData.service?.nom}</p>
                <p className="text-lg mb-4">Temps d'attente estimé: {ticketData.temps_attente_estime_minutes} minutes</p>
                <p className="text-sm">Patient: {verifiedPatient?.nom} {verifiedPatient?.prenom}</p>
                <p className="text-xs mt-4">Date: {new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</p>
              </div>
              <div className="mt-4 bg-blue-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">🔔 Notifications</p>
                    <p className="text-sm text-blue-700">Soyez alerté quand votre tour arrive</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!('Notification' in window)) {
                        alert('Votre navigateur ne supporte pas les notifications');
                        return;
                      }
                      
                      if (Notification.permission === 'granted') {
                        alert('Notifications déjà activées ! Vous serez alerté quand votre tour arrivera.');
                      } else if (Notification.permission === 'denied') {
                        alert('Notifications bloquées. Veuillez les activer dans les paramètres de votre navigateur.');
                      } else {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          if (isPushSupported() && verifiedPatient?.id && selectedService) {
                            try {
                              await subscribeToPush(verifiedPatient.id, selectedService);
                              alert('Notifications activées ! Vous serez alerté quand votre tour arrivera.');
                            } catch (err) {
                              alert('Erreur lors de l\'activation des notifications');
                            }
                          }
                        } else {
                          alert('Notifications non autorisées');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' 
                      ? '✅ Activées' 
                      : 'Activer les notifications'}
                  </button>
                </div>
              </div>
              <button
                onClick={() => navigate(`/display?service=${selectedService}`)}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Voir l'évolution de la file
              </button>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Patient verified - show service selection
  if (verifiedPatient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="relative mb-4">
              <img
                src="/hopital_de_kyeshero.jpeg"
                alt="Hôpital de Kyeshero"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Bienvenue, {verifiedPatient.prenom} {verifiedPatient.nom}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sélectionnez le service pour récupérer votre numéro
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-gray-700">
                Service
              </label>
              <select
                id="service_id"
                value={selectedService}
                onChange={(e) => setSelectedService(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Sélectionnez un service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.nom}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGetTicket}
              disabled={loading || selectedService === 0}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Chargement...' : 'Obtenir/Récupérer mon numéro'}
            </button>

            <button
              onClick={handleReset}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial verification form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="relative mb-4">
            <img
              src="/hopital_de_kyeshero.jpeg"
              alt="Hôpital de Kyeshero"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Récupérer mon numéro
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez vos informations pour récupérer votre numéro de passage
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="bg-white py-8 px-6 shadow rounded-lg space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {patientNotFound && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  Patient non trouvé. Veuillez vous enregistrer comme nouveau patient.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/patient')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  S'enregistrer comme nouveau patient
                </button>
              </div>
            )}

            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                Numéro de téléphone
              </label>
              <input
                id="telephone"
                type="tel"
                required
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 2439xxxxx"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                Date de naissance
              </label>
              <input
                id="date_naissance"
                type="date"
                required
                value={date_naissance}
                onChange={(e) => setDate_naissance(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={verifying}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Vérification...' : 'Vérifier mon identité'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/patient')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Nouveau patient ? S'enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRetrieve;
