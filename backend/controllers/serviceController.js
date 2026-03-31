const Service = require('../models/Service');

const getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const createService = async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le nom du service est requis' });
    }

    // Vérifier si le service existe déjà
    const existingService = await Service.findByName(nom);
    if (existingService) {
      return res.status(400).json({ message: 'Ce service existe déjà' });
    }

    const serviceId = await Service.create({ nom, description });

    res.status(201).json({
      message: 'Service créé avec succès',
      service_id: serviceId
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    await Service.update(id, { nom, description });

    res.json({ message: 'Service mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: 'Service non trouvé' });
    }

    await Service.delete(id);

    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllServices,
  createService,
  updateService,
  deleteService
};
