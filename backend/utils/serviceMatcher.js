/**
 * Module de correspondance entre la description du problème et les services
 * Utilise des mots-clés pour suggérer automatiquement le service approprié
 */

// Correspondance mots-clés -> ID du service (basé sur la table services)
// Note: Ces IDs peuvent varier selon la base de données
// Mapper les noms de services aux IDs
const serviceKeywords = {
  // ID 1: Gynéco-Obstétrique et maternité
  1: [
    // Français
    'grossesse', 'grossese', 'grossesse', 'enceint', 'accouch', 'accouchement', 'accouchée', 'accoucher',
    'femme', 'femmes', 'gynéco', 'gyneco', 'gynecologie', 'gynécologie', 'obstétrique', 'obstetrique',
    'maternité', 'maternite', 'naissance', 'bébé', 'bebe', 'foetus', 'fœtus', 'fetus',
    'contraception', 'pilule', 'stérilet', 'préservatif', 'avortement', 'IVG',
    'échographie', 'echographie', 'suivi grossesse', 'monitoring', 'travail', 'travaille',
    'dilatation', 'contractions', 'perte eaux', 'placenta', 'cord ombilical',
    'kyste ovarien', 'fibrome', 'endométriose', 'endometriose', ' règles', 'regles', 'menstru',
    'cycle', 'ovulation', 'infertilité', 'infertilite', 'fécondation', 'fecondation',
    // Lingala
    'embongo', 'eyebisa', 'like', 'mwana', 'mwana ya', 'libala', 'kozala',
    // English
    'pregnancy', 'pregnant', 'delivery', 'childbirth', 'baby', 'fetus', 'ultrasound',
    'labor', 'contraction', 'child', 'birth', 'obgyn', 'ob-gyn', 'gynecology'
  ],

  // ID 2: Pédiatrie et Néonatologie
  2: [
    // Français
    'enfant', 'enfants', 'nourisson', 'nourrisson', 'bébé', 'bebe', 'petit', 'petits',
    'pédiatrie', 'pediatrie', 'néonatologie', 'neonatologie', 'pediatrique',
    'fièvre', 'fievre', 'temperature', 'toux', 'tousse', 'rhume', 'rhum', 'nez',
    'vomissement', 'vomissements', 'diarrhée', 'diarrhee', 'douleur ventre', 'ventre',
    'maladie', 'maladies', 'infection', 'infections', 'virus', 'bactérie', 'bacterie',
    'vaccin', 'vaccination', 'vaccinations', 'rappels', 'gastro', 'gastroenterite',
    'otite', 'angine', 'bronchiolite', 'bronchite', 'pneumonie', 'asthme', 'allergie',
    'eczema', 'éruption', 'eruption', 'rougeole', 'varicelle', 'rubéole', 'oreillons',
    'développement', 'croissance', 'poids', 'taille', 'retard', 'autisme', 'hyperactivité',
    ' malnutrition', 'carence', 'anémie', 'anemie',
    // Lingala
    'mwana', 'bana', 'mzanga', 'eye', 'elela', 'maladi ya', 'febrile',
    // English
    'child', 'children', 'baby', 'infant', 'pediatric', 'pediatrics', 'fever', 'cough',
    'vomit', 'diarrhea', 'stomach', 'growth', 'development', 'vaccine', 'vaccination'
  ],

  // ID 3: Consultation générale et spécialisée
  3: [
    // Français
    'général', 'generale', 'consultation', 'consultations', 'routine', 'check-up', 'bilan',
    'santé', 'sante', 'bien-être', 'bien etre', 'malaise', 'malaises', 'fatigue',
    'vertige', 'vertiges', 'étourdissement', 'etourdissement', 'tête', 'tete', 'céphalée',
    'maux tête', 'mal tête', 'douleur', 'douleurs', 'symptôme', 'symptomes', 'signes',
    'maladie', 'maladies courantes', 'grippe', 'grippal', 'refroidissement', ' sinusite',
    'allergie', 'allergies', 'test', 'analyses', 'prise sang', 'sang', 'urines',
    'radio', 'radiographie', 'échographie', 'echographie', 'scanner', 'IRM', 'scintigraphie',
    'ordonnance', 'prescription', 'traitement', 'traitements', 'médicament', 'medicaments',
    'suivi', 'contrôle', 'controle', 'chronic', 'chronique', 'diabète', 'diabete',
    'hypertension', 'tension', 'cholesterol', 'thyroïde', 'thyroide', 'cardiovasculaire',
    // Lingala
    'sante', 'boko', 'motema', 'mokolo', 'kolia', 'kukunda', 'consultation',
    // English
    'general', 'consultation', 'checkup', 'health', 'wellness', 'fatigue', 'dizziness',
    'headache', 'pain', 'symptoms', 'treatment', 'medication', 'prescription', 'routine'
  ],

  // ID 4: Chirurgie Générale
  4: [
    // Français
    'chirurgie', 'chirurgical', 'opération', 'operation', 'opérer', 'operer', 'opéré',
    'chirurgien', 'incision', 'cicatrice', 'anesthésie', 'anesthesie', 'anesthésique',
    'abdomen', 'abdominal', 'ventre', 'hernie', 'hernies', ' appendicite', 'appendicite',
    'vésicule', 'vesicule', 'calculs', 'calcul', 'lithiase', 'tympan', 'amygdales',
    'adénome', 'adénome', 'kyste', 'kystes', 'tumeur', 'tumeurs', 'masse', 'nodule',
    'biopsie', 'laparoscopie', 'laparotomie', 'cœlioscopie', 'coelioscopie',
    'hémorroïdes', 'hemorroides', 'fissure', 'fistule', 'abcès', 'abces',
    'thyroïde', 'thyroide', 'ganglion', 'ganglions', 'lipome', 'verrue', 'graillon',
    'castration', 'stérilisation', 'sterilisation', 'vasectomie', 'post-opératoire',
    ' Suites opératoires', 'soins post-op', 'ablation', 'retrait',
    // Lingala
    'operation', 'kokanga', 'mokila', 'bir外科', 'surgery', 'surgical',
    // English
    'surgery', 'surgical', 'operation', 'incision', 'anesthesia', 'abdomen', 'abdominal',
    'hernia', 'appendicitis', 'gallbladder', 'cyst', 'tumor', 'biopsy', 'laparoscopy'
  ],

  // ID 5: Médecine Interne et soins intensifs
  5: [
    // Français
    'interne', 'interne', 'médecine', 'medecine', 'interne', 'soins intensifs', 'réanimation',
    'reanimation', 'UVSI', 'bloc', 'réanimation', 'grave', 'graves', 'critique', 'critiques',
    'cardiaq', 'cardiaques', 'cœur', 'coeur', 'cardiovasculaire', 'infarctus', 'AVC', 'accident vasculaire',
    'insuffisance', 'cardiaque', 'respiratoire', 'rénale', 'renale', 'hépatique', 'hepatique',
    'respiration', 'respiratoire', 'poumon', 'pneumonie', 'bronchite', 'asthme', 'BPCO',
    'rein', 'rins', 'dialyse', 'insuffisance rénale', 'calculs rénaux',
    'foie', 'foie', 'hépatite', 'hepatite', 'cirrhose', 'jaunisse', 'ictère',
    'diabète', 'diabete', 'hypoglycémie', 'hypoglycemie', 'acidose', 'cétonurie',
    'sepsis', 'septicémie', 'septicemie', 'méningite', 'méningite', 'encéphalite',
    'embolie', 'thrombose', 'phlébite', 'phlebite', 'TVP', 'anticoagulant',
    'anémie', 'anemie', 'leucémie', 'leucemie', 'lymphome', 'myélome',
    'lupus', 'sclérose', 'sclerose', 'parkinson', 'alzheimer', 'épilepsie', 'epilepsie',
    'dépression', 'depression', 'anxiété', 'anxiete', 'troubles alimentaires',
    // Lingala
    'motema', 'cpk', 'coeur', 'coeur', 'poumon', 'rein', 'foie', 'diabete',
    // English
    'internal medicine', 'intensive care', 'ICU', 'critical', 'critical care', 'cardiac',
    'heart', 'respiratory', 'renal', 'hepatic', 'diabetes', 'sepsis', 'stroke'
  ],

  // ID 6: Dentisterie
  6: [
    // Français
    'dent', 'dents', 'dentaire', 'dentiste', 'dentisterie', 'cabinet dentaire',
    'rage dent', 'rage de dent', 'mal dent', 'douleur dent', 'dents',
    'carie', 'caries', 'cavité', 'cavite', 'trou', 'trous',
    'plombage', 'plombages', 'obturation', 'obturations', 'composite', 'amalgame',
    'détartrage', 'detartrage', 'tartre', 'nettoyage', 'brossage',
    'extraction', 'arrachement', 'arracher', 'extrait', 'dents de sagesse',
    'couronne', 'couronnes', 'bridge', 'bridges', 'prothèse', 'prothese', 'dentier',
    'implant', 'implants', 'implantologie', 'orthodontie', 'bagues', 'appareil',
    'gencives', 'gencives', 'gingivite', 'parodontite', 'déchaussement', 'dechaussement',
    'abcès dental', 'abces dental', 'infection dent', 'pulpite', 'nerf',
    'sensibilité', 'sensible', 'froid', 'chaud', 'sucre',
    'blanchiment', 'esthétique', 'esthetique', 'sourire',
    // Lingala
    'zame', 'mino', 'miono', 'miono', 'mous', 'maux', 'cabinet ya mino',
    // English
    'tooth', 'teeth', 'dental', 'dentist', 'dentistry', 'caries', 'cavity', 'filling',
    'extraction', 'root canal', 'crown', 'bridge', 'implant', 'gum', 'gingivitis',
    'toothache', 'tooth pain'
  ],

  // ID 7: Urgence hospitalière
  7: [
    // Français
    'urgence', 'urgences', 'urgent', 'urgente', 'urgents', 'SECOURS', 'secours',
    'ambulance', 'SAMU', 'SMUR', 'pompe funèbre', 'pompes funèbres',
    'douleur', 'douleurs intenses', 'intense', 'insupportable', 'extrême', 'extreme',
    'accident', 'accidents', 'traumatisme', 'traumatismes', 'choc', 'blessure', 'blessures',
    'fracture', 'fractures', 'os', 'cassure', 'entorse', 'luxation', 'dislocation',
    'coupure', 'coupures', 'plaie', 'plaies', 'saignement', 'saignements', 'hémorragie',
    'hemorragie', 'sang', 'brûlure', 'brulure', 'brûlures', 'brulures', 'feu',
    'étouffement', 'etouffement', 'noyade', 'électrocution', 'electrocution',
    'empoisonnement', 'intoxication', 'overdose', 'OD', 'piqûre', 'piqure', 'morsure',
    'animal', 'serpent', 'chien', 'insecte', 'allergie', 'réaction allergique',
    'difficulté respirer', 'étranglement', 'étrangler', 'suffoquer', 'asphyxie',
    'perte connaissance', 'inconscience', 'inconscient', 'évanouissement', 'evanouissement',
    'crise', 'crises', 'convulsions', 'épilepsie', 'epilepsie', 'AVC', 'infarctus',
    'arrêt cardiaque', 'arret cardiaque', 'réanimation', 'reanimation', 'massage cardiaque',
    'suicide', 'tentative', 'automutilation', 'aggression', 'viol', 'abus',
    // Lingala
    'urgence', 'nzela', 'kokanga', 'kokua', 'kobeta', 'kobeta nkisi',
    // English
    'emergency', 'urgent', 'ambulance', 'accident', 'trauma', 'injury', 'bleeding',
    'burn', 'fracture', 'choking', 'unconscious', 'seizure', 'heart attack', 'stroke'
  ],

  // ID 8: Hépato gastro entérologie
  8: [
    // Français
    'gastro', 'gastro-enterologie', 'gastroentérologie', 'gastroenterologie', 'digestif', 'digestive',
    'estomac', 'ventre', 'abdomen', 'abdominal', 'intestinal', 'intestin',
    'nausée', 'nausee', 'nausées', 'vomir', 'vomissement', 'vomissements', 'vomi',
    'diarrhée', 'diarrhee', 'diarrhées', 'selles', 'garde', 'constipation',
    'ballonnements', 'ballonnement', 'gaz', 'flatulence', 'digestion', 'indigestion',
    'brûlure estomac', 'brulure estomac', 'reflux', 'RGO', 'gastro-oesophagien',
    'oesophage', 'œsophage', 'ulcère', 'ulcere', 'ulcères', 'helicobacter',
    'foie', 'hépatique', 'hépatite', 'hepatite', 'jaunisse', 'ictère', 'cirrhose',
    'vésicule', 'vesicule', 'biliaire', 'calculs', 'colique', 'pancréas', 'pancreatite',
    ' Crohn', 'crohn', 'rectocolite', 'RCH', 'colite', 'colites', 'syndrome côlon',
    'côlon', 'colon', 'polype', 'polypes', 'cancer', 'tumeur', 'endoscopie', 'coloscopie',
    'fibroscopie', 'gastroscopie', 'anévrysme', 'anevrysme', 'angiodysplasie',
    'ballonnet', 'gastrostomie', 'alimentation', 'nutrition', 'parentérale', 'parenterale',
    // Lingala
    'gastro', 'kibula', 'kobeta', 'kobeta nkisi', 'maladi ya mimi',
    // English
    'gastro', 'gastroenterology', 'digestive', 'stomach', 'abdomen', 'vomit', 'nausea',
    'diarrhea', 'constipation', 'liver', 'hepatitis', 'pancreas', 'intestine', 'bowel',
    'endoscopy', 'colonoscopy'
  ],

  // ID 9: Urologie andrologie
  9: [
    // Français
    'urologie', 'uro', 'andrologie', 'andrologue', 'rein', 'rins', 'urinaire', 'urinaire',
    'vessie', 'vessie', 'urètre', 'uretre', 'prostate', 'prostates', 'testicule', 'testicules',
    'pénis', 'penis', 'verge', 'scrotum', 'bourse', 'bourses',
    'difficulté uriner', 'dysurie', 'brûlure uriner', 'pollakiurie', 'nycturie',
    'urine', 'urines', 'sang urine', 'hématurie', 'hematurie', 'protéinurie',
    'infection urinaire', 'IU', 'cystite', 'cystites', 'pyélonéphrite', 'pyelonephrite',
    'calculs', 'calcul', 'lithiase', 'colique néphrétique', 'colique renale',
    'hyperplasie', 'HBP', 'adénome prostate', 'cancer prostate', 'PSA',
    'vasectomie', 'stérilisation', 'sterilisation masculine', 'circoncision',
    'érection', 'érections', 'dysfonctionnement', 'impuissance', 'trouble érectile',
    'éjaculation', 'ejaculation', 'prématurée', 'premieree', 'retard ejac',
    'infertility', 'infertilité', 'sperme', 'spermogramme', 'FIV', 'ICSI',
    'testicule', 'cryptorchidie', 'hydrocèle', 'hydrocele', 'varicocèle', 'varicocele',
    'traumatisme testiculaire', 'torsion', 'torsion testicule', 'cancer testicule',
    'incontinence', 'fuites', 'fuites urinaires', 'bandelette', 'sling',
    // Lingala
    'urinaire', 'prostate', 'zame', 'mousto', 'kozanga', 'kokanga',
    // English
    'urology', 'urological', 'prostate', 'testicle', 'penis', 'bladder', 'kidney',
    'urinary', 'urination', 'incontinence', 'impotence', 'erection', 'infertility'
  ],

  // ID 10: Imagerie médicale
  10: [
    // Français
    'imagerie', 'imagerie médicale', 'radiologie', 'radiographie', 'radio', 'radios',
    'échographie', 'echographie', 'echo', 'ultrasons', 'Doppler', 'doppler',
    'scanner', 'tomodensitométrie', 'TDM', 'IRM', 'résonance', 'resonance',
    'mammographie', 'mammographie', 'densitométrie', 'osteodensitometrie', 'DEXA',
    'radio pulmonaire', 'radio poumons', 'thorax', 'cardio', 'abdomen sans préparation',
    'ASP', 'urographie', 'pyélographie', 'cystographie', 'arthrographie',
    'angiographie', 'angio', 'scintigraphie', 'TEP', 'PET-scan', 'PET scan',
    'biopsie', 'biopsies', 'cytoponction', 'prélevement', 'prelevements',
    'rayons X', 'rayons x', 'irradiation', 'dose', 'contraste', 'produit contraste',
    'injection', 'intraveineuse', 'IV', 'iode', 'gadolinium', 'allergie iode',
    'résultats', 'resultats', 'compte rendu', 'CR', 'film', 'images', 'CD', 'clé USB',
    'suivi', 'contrôle', 'controle', 'cancer', 'tumeur', 'dépistage', 'depiStage',
    // Lingala
    'imagerie', 'echo', 'scanner', 'radio', 'kokanga', 'kobanda',
    // English
    'imaging', 'radiology', 'x-ray', 'ultrasound', 'scan', 'scanner', 'MRI', 'CT scan',
    'mammography', 'biopsy', 'imaging', 'radiography'
  ],

  // ID 11: Pharmacie
  11: [
    // Français
    'pharmacie', 'pharmaceutique', 'médicament', 'medicament', 'médicaments', 'medicaments',
    'ordonnance', 'ordonnances', 'prescription', 'prescriptions', 'délivrance', 'delivrance',
    'posologie', 'dosage', 'dose', 'doses', 'prises', 'comprimé', 'comprimes', 'gélule',
    'gélules', 'sirop', 'sirops', 'injectable', 'injection', 'injections', 'piqure',
    'pommade', 'crème', 'creme', 'gel', 'patch', 'gouttes', 'suppositoire', 'ovule',
    '相互作用', 'interaction', 'effets secondaires', 'effet secondaire', 'contre-indication',
    'allergie medicament', 'effets indésirables', 'toxicité', 'toxicite',
    'vaccin', 'vaccination', 'injection', 'rappels', 'grippe', 'COVID', 'hépatite',
    'antibiotique', 'antibiotiques', 'antibio', 'antalgique', 'antalgiques', 'douleur',
    'ant-inflammatoire', 'AINS', 'ibuprofène', 'ibuprofene', 'paracétamol', 'doliprane',
    'corticoïde', 'corticoide', 'cortisol', 'insuline', 'anticoagulant', 'anticoagulants',
    'antidépresseur', 'antidepresseur', 'anxiolytique', 'hypnotique', 'psychotrope',
    'générique', 'generique', 'original', 'princeps', 'substitution', 'remboursement',
    'mutuelle', 'Assurance', 'CPAM', 'Sécurité sociale', 'tiers payant', 'ticket modérateur',
    'dispensation', 'conseil', 'pharmacien', 'préparation', 'formulation',
    'mélange', 'incompatible', 'conservation', 'temperature', 'delai', 'péremption',
    // Lingala
    'mokolo', 'bosanda', 'ndambo', 'bitumba', 'mokanda', 'mokanda mosisa',
    // English
    'pharmacy', 'pharmaceutical', 'medication', 'medicine', 'drug', 'drugs', 'prescription',
    'dosage', 'dose', 'tablet', 'capsule', 'syrup', 'injection', 'vaccine', 'vaccination'
  ]
};

/**
 * Analyse la description du problème et suggère un service
 * @param {string} description - Description du problème du patient
 * @returns {Object} - { serviceId, serviceName, confidence } ou null
 */
const suggestService = (description) => {
  if (!description || description.trim().length < 3) {
    return null;
  }

  const normalizedDescription = description.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^\w\s]/g, ' ') // Supprimer la ponctuation
    .replace(/\s+/g, ' '); // Normaliser les espaces

  const words = normalizedDescription.split(' ');
  
  let bestMatch = { serviceId: null, score: 0, serviceName: '' };

  // Pour chaque service, calculer le score de correspondance
  for (const [serviceId, keywords] of Object.entries(serviceKeywords)) {
    let score = 0;
    const serviceKeywordsNormalized = keywords.map(k => 
      k.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    );

    // Vérifier chaque mot-clé
    for (const keyword of serviceKeywordsNormalized) {
      if (keyword.length < 3) continue;
      
      // Correspondance exacte d'un mot
      if (words.includes(keyword)) {
        score += 10;
      }
      // Correspondance partielle (contient)
      else if (normalizedDescription.includes(keyword)) {
        score += 5;
      }
      // Correspondance avec les mots partiels
      else {
        for (const word of words) {
          if (word.length > 3 && (keyword.includes(word) || word.includes(keyword))) {
            score += 3;
          }
        }
      }
    }

    if (score > bestMatch.score) {
      bestMatch = {
        serviceId: parseInt(serviceId),
        score,
        serviceName: getServiceName(parseInt(serviceId))
      };
    }
  }

  // Seuil minimum pour considérer comme une correspondance valide
  if (bestMatch.score >= 5) {
    return {
      serviceId: bestMatch.serviceId,
      serviceName: bestMatch.serviceName,
      confidence: Math.min(bestMatch.score / 20, 1) // Confidence entre 0 et 1
    };
  }

  return null;
};

// Mapper les IDs vers les noms de services (doit correspondre à la DB)
const getServiceName = (id) => {
  const services = {
    1: 'Gynéco-Obstétrique et maternité',
    2: 'Pédiatrie et Néonatologie',
    3: 'Consultation générale et spécialisée',
    4: 'Chirurgie Générale',
    5: 'Médecine Interne et soins intensifs',
    6: 'Dentisterie',
    7: 'Urgence hospitalière',
    8: 'Hépato gastro entérologie',
    9: 'Urologie andrologie',
    10: 'Imagerie médicale',
    11: 'Pharmacie'
  };
  return services[id] || 'Service inconnu';
};

/**
 * Endpoint API pour tester la suggestion
 */
const getAllKeywords = () => {
  const result = {};
  for (const [serviceId, keywords] of Object.entries(serviceKeywords)) {
    result[getServiceName(parseInt(serviceId))] = keywords.slice(0, 20); // Limiter à 20 mots par service
  }
  return result;
};

module.exports = {
  suggestService,
  getAllKeywords,
  serviceKeywords
};
