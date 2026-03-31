import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../types';
import { subscribeToPush, isPushSupported } from '../utils/push';

interface PatientData {
  nom: string;
  prenom: string;
  date_naissance: string;
  telephone: string;
  adresse: string;
  service_id: number;
  description_probleme?: string;
}

interface RegistrationResponse {
  message: string;
  patient_id: number;
  queue_id: number;
  numero: number;
  temps_attente_estime_minutes: number;
  service?: {
    id: number;
    nom: string;
  };
  service_suggere?: {
    id: number;
    nom: string;
    confiance: number;
  } | null;
}

const PatientCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationResponse | null>(null);
  const [serviceSuggestion, setServiceSuggestion] = useState<{id: number, nom: string, confiance: number} | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [formData, setFormData] = useState<PatientData>({
    nom: '',
    prenom: '',
    date_naissance: '',
    telephone: '',
    adresse: '',
    service_id: 0,
    description_probleme: ''
  });
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);

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
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si le champ description change et fait plus de 3 caractères, suggérer un service
    if (name === 'description_probleme' && value.length > 3 && formData.service_id === 0) {
      getServiceSuggestion(value);
    }
    // Si l'utilisateur sélectionne un service, effacer la suggestion
    if (name === 'service_id' && Number(value) > 0) {
      setServiceSuggestion(null);
    }
  };

  const getServiceSuggestion = async (description: string) => {
    if (description.length < 3) return;
    setSuggesting(true);
    try {
      const response = await fetch('/api/public/suggest-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      const data = await response.json();
      if (data.suggestion) {
        setServiceSuggestion({
          id: data.suggestion.serviceId,
          nom: data.suggestion.serviceName,
          confiance: data.suggestion.confidence
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suggestion:', error);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        ...formData,
        description_probleme: formData.description_probleme
      }),
      });

      if (response.ok) {
        const data: RegistrationResponse = await response.json();
        setRegistrationData(data);
        setSubmitted(true);
        
        // S'abonner aux notifications push après l'enregistrement
        if (isPushSupported() && data.patient_id && formData.service_id) {
          try {
            const pushResult = await subscribeToPush(data.patient_id, Number(formData.service_id));
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
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && registrationData) {
    const selectedService = services.find(s => s.id === Number(formData.service_id));
    // Utiliser le service de la réponse ou celui sélectionné
    const displayService = registrationData.service?.nom || selectedService?.nom || 'Service non spécifié';
    
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
                Enregistrement réussi !
              </h2>
              <div className="mt-8 space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-lg font-semibold text-blue-900">
                    Service: {displayService}
                  </p>
                  {registrationData.service_suggere && (
                    <p className="text-sm text-blue-700 mt-1">
                      (Service suggéré basé sur votre description)
                    </p>
                  )}
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-lg font-semibold text-green-900">
                    Votre numéro est {registrationData.numero}. Veuillez patienter.
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Temps d'attente estimé: {registrationData.temps_attente_estime_minutes} minutes
                  </p>
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
                            // Réessayer l'inscription après permission
                            if (isPushSupported() && registrationData.patient_id && formData.service_id) {
                              try {
                                await subscribeToPush(registrationData.patient_id, Number(formData.service_id));
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
              </div>
              {/* Bouton d'impression avec le même modèle que le personnel */}
              <button
                onClick={() => {
                  const formatWaitTime = (minutes: number) => {
                    if (minutes < 60) {
                      return minutes + " min";
                    } else {
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return hours + "h " + mins + " min";
                    }
                  };
                  
                  const printContent = `
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
      font-size: 20px;
      color: #1a1a1a;
      font-weight: bold;
    }
    .header p {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .ticket-number {
      text-align: center;
      background: #2563eb;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .ticket-number .number {
      font-size: 48px;
      font-weight: bold;
    }
    .ticket-number .label {
      font-size: 14px;
      margin-top: 5px;
    }
    .info {
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-label {
      color: #666;
      font-size: 14px;
    }
    .info-value {
      font-weight: 500;
      font-size: 14px;
    }
    .wait-time {
      text-align: center;
      padding: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      margin: 15px 0;
    }
    .wait-time span {
      font-weight: bold;
      color: #2563eb;
    }
    .footer {
      text-align: center;
      border-top: 2px dashed #333;
      padding-top: 15px;
      margin-top: 15px;
    }
    .footer p {
      font-size: 12px;
      color: #666;
      margin: 3px 0;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>HOPITAL DE KYESHERO</h1>
      <p>République Démocratique du Congo</p>
    </div>
    
    <div class="ticket-number">
      <div class="number">#${registrationData.numero}</div>
      <div class="label">Numéro de passage</div>
    </div>
    
    <div class="info">
      <div class="info-row">
        <span class="info-label">Patient:</span>
        <span class="info-value">${formData.nom} ${formData.prenom}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${displayService}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date:</span>
        <span class="info-value">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Heure:</span>
        <span class="info-value">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
    
    <div class="wait-time">
      ⏱️ Temps d'attente estimé: <span>${formatWaitTime(registrationData.temps_attente_estime_minutes)}</span>
    </div>
    
    <div class="footer">
      <p>Merci de patienter</p>
      <p>Vous serez appelé par SMS ou à l'écran</p>
    </div>
  </div>
</body>
</html>`;
                  
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
                }}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🖨️ Imprimer mon ticket
              </button>
              <button
                onClick={() => navigate(`/display?service=${formData.service_id}`)}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Voir l'évolution de la file
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setRegistrationData(null);
                  setFormData({
                    nom: '',
                    prenom: '',
                    date_naissance: '',
                    telephone: '',
                    adresse: '',
                    description_probleme: '',
                    service_id: 0
                  });
                }}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="absolute top-4 left-1 transform -translate-x-1 text-4xl font-bold text-white bg-black bg-opacity-0 px-4 py-4 rounded text-center">
              Bienvenu à l'hôpital de Kyeshero
            </h1>
            <h2 className="absolute top-20 left-1 transform -translate-x-1 text-2xl font-semibold text-white bg-black bg-opacity-0 px-4 py-8 rounded text-center">
              Système de gestion des files d'attente
            </h2>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Signalement de présence
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {showNewPatientForm ? 'Veuillez remplir vos informations pour prendre un numéro' : 'Veuillez choisir une option ci-dessous'}
          </p>
        </div>
        {/* Formulaire d'enregistrement */}
        {showNewPatientForm ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white py-8 px-6 shadow rounded-lg space-y-4">
            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-gray-700">
                Service
              </label>
              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleInputChange}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom *
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                  Prénom *
                </label>
                <input
                  id="prenom"
                  name="prenom"
                  type="text"
                  required
                  value={formData.prenom}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="date_naissance" className="block text-sm font-medium text-gray-700">
                Date de naissance *
              </label>
              <input
                id="date_naissance"
                name="date_naissance"
                type="date"
                required
                value={formData.date_naissance}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                id="adresse"
                name="adresse"
                type="text"
                value={formData.adresse}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description_probleme" className="block text-sm font-medium text-gray-700">
                Description du problème
              </label>
              <textarea
                id="description_probleme"
                name="description_probleme"
                rows={3}
                value={formData.description_probleme}
                onChange={handleInputChange}
                placeholder="Décrivez votre problème ou symptôme si vous ne savez pas quel service choisir"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Suggestion de service basée sur la description */}
            {(serviceSuggestion || suggesting) && formData.service_id === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                {suggesting ? (
                  <p className="text-sm text-blue-600">Recherche du service approprié...</p>
                ) : serviceSuggestion ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Service recommandé : {serviceSuggestion.nom}
                      </p>
                      <p className="text-xs text-blue-600">
                        Confiance: {Math.round(serviceSuggestion.confiance * 100)}%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, service_id: serviceSuggestion.id }));
                        setServiceSuggestion(null);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Utiliser ce service
                    </button>
                  </div>
                ) : null}
              </div>
            )}

          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (formData.service_id === 0 && !formData.description_probleme?.trim())}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enregistrement...' : 'Prendre un numéro'}
            </button>
          </div>
        </form>
        ) : (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setShowNewPatientForm(true)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Nouveau patient
            </button>
            <button
              onClick={() => navigate('/patient/retrieve')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Patient existant ? Récupérer mon numéro
            </button>
            <button
              onClick={() => navigate('/display')}
              className="w-full flex justify-center py-3 px-4 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Consulter la file d'attente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCheckIn;