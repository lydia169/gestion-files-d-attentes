/**
 * Module de suggestion de service basé sur l'IA (Groq)
 * Utilise l'API Groq pour une meilleure compréhension du langage naturel
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Liste des services de l'hôpital (doit correspondre à la DB)
const SERVICES = [
  { id: 1, nom: 'Gynéco-Obstétrique et maternité' },
  { id: 2, nom: 'Pédiatrie et Néonatologie' },
  { id: 3, nom: 'Consultation générale et spécialisée' },
  { id: 4, nom: 'Chirurgie Générale' },
  { id: 5, nom: 'Médecine Interne et soins intensifs' },
  { id: 6, nom: 'Dentisterie' },
  { id: 7, nom: 'Urgences' },
  { id: 8, nom: 'Laboratoire' },
  { id: 9, nom: 'Imagerie médicale' },
  { id: 10, nom: 'Pharmacie' },
  { id: 11, nom: 'Physiothérapie' }
];

/**
 * Calcule l'âge à partir de la date de naissance
 * @param {string} dateDeNaissance - Date de naissance au format YYYY-MM-DD
 * @returns {number} - Âge en années
 */
const calculerAge = (dateDeNaissance) => {
  if (!dateDeNaissance) return null;
  
  const today = new Date();
  const birthDate = new Date(dateDeNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Ajuster si l'anniversaire n'a pas encore eu lieu cette année
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Suggestion de service via IA Groq
 * @param {string} description - Description du problème du patient
 * @param {string} dateDeNaissance - Date de naissance du patient
 * @returns {Object} - { serviceId, serviceName, confidence } ou null
 */
const suggestServiceWithAI = async (description, dateDeNaissance) => {
  // Vérifier si la description est suffisante
  if (!description || description.trim().length < 3) {
    return null;
  }

  // Récupérer la clé API depuis les variables d'environnement
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.log('⚠️ Pas de clé API Groq définie, utilisation des mots-clés');
    return null;
  }

  // Calculer l'âge du patient
  const age = calculerAge(dateDeNaissance);
  let ageInfo = '';
  if (age !== null) {
    if (age < 15) {
      ageInfo = `Le patient est un ENFANT de ${age} ans.`;
    } else if (age >= 60) {
      ageInfo = `Le patient est une PERSONNE ÂGÉE de ${age} ans.`;
    } else {
      ageInfo = `Le patient est un ADULTE de ${age} ans.`;
    }
  }

  // Préparer la liste des services pour le prompt
  const servicesList = SERVICES.map(s => `${s.id}: ${s.nom}`).join('\n');

  const systemPrompt = `Tu es un assistant médical qui suggère le service hospitalier le plus approprié selon les symptômes décrits par le patient.

Voici les services disponibles à l'hôpital de Kyeshero:
${servicesList}

${ageInfo}

Règles importantes:
- SI l'âge est connu et que c'est un ADULTE (15+ ans) → NE JAMAIS suggérer Pédiatrie (ID 2)
- SI l'âge est connu et que c'est un ENFANT (< 15 ans) → privilégiez Pédiatrie (ID 2)
- Pour la fièvre typhoïde chez un adulte → Laboratoire (ID 8) ou Médecine Interne (ID 5)
- Analyse la description des symptômes
- Choisis le service le plus pertinent
- Réponds UNIQUEMENT avec le numéro du service (1-11)
- Si tu n'es pas sûr, choisis "3" (Consultation générale)

Exemples:
- "j'ai mal aux dents" adulte → 6
- "mon enfant a de la fièvre" → 2
- "je suis adulte et j'ai la typhoïde" → 8
- "fièvre typhoïde adulte" → 8
- "j'ai mal au ventre et je vomis" adulte → 8
- "accident" → 7`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: description }
        ],
        temperature: 0.3,
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur Groq:', errorData);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || '';

    // Extraire le numéro du service de la réponse
    const serviceIdMatch = aiResponse.match(/(\d+)/);
    
    if (serviceIdMatch) {
      const serviceId = parseInt(serviceIdMatch[1]);
      const service = SERVICES.find(s => s.id === serviceId);
      
      if (service) {
        console.log(`🤖 IA a suggéré: ${service.nom} (ID: ${serviceId}) pour: "${description}" [Age: ${age}]`);
        return {
          serviceId: service.id,
          serviceName: service.nom,
          confidence: 0.85 // L'IA a une confiance élevée
        };
      }
    }

    console.log('⚠️ Réponse IA invalide:', aiResponse);
    return null;

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel à l\'IA:', error.message);
    return null;
  }
};

/**
 * Suggestion avec fallback - essaie IA puis mots-clés
 * @param {string} description - Description du problème
 * @param {string} dateDenaissance - Date de naissance du patient
 * @param {Function} keywordFallback - Fonction de fallback par mots-clés
 * @returns {Object} - Résultat de la suggestion
 */
const suggestServiceWithFallback = async (description, dateDenaissance, keywordFallback) => {
  // Essayer d'abord avec l'IA
  const aiResult = await suggestServiceWithAI(description, dateDenaissance);
  
  if (aiResult) {
    return aiResult;
  }

  // Fallback vers les mots-clés si l'IA échoue
  console.log('🔄 Utilisation du système de mots-clés comme fallback');
  return keywordFallback ? keywordFallback(description) : null;
};

module.exports = {
  suggestServiceWithAI,
  suggestServiceWithFallback,
  SERVICES
};
