const Patient = require('../models/Patient');

const createPatient = async (req, res) => {
  try {
    const patientData = req.body;
    const patientId = await Patient.create(patientData);
    
    const patient = await Patient.findById(patientId);
    res.status(201).json({
      message: 'Patient créé avec succès',
      patient
    });
  } catch (error) {
    console.error('Erreur lors de la création du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (error) {
    console.error('Erreur lors de la récupération des patients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }
    
    res.json(patient);
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Paramètre de recherche requis' });
    }
    
    const patients = await Patient.search(q);
    res.json(patients);
  } catch (error) {
    console.error('Erreur lors de la recherche des patients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const patientData = req.body;
    
    await Patient.update(id, patientData);
    const updatedPatient = await Patient.findById(id);
    
    res.json({
      message: 'Patient mis à jour avec succès',
      patient: updatedPatient
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    await Patient.delete(id);
    
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du patient:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  searchPatients,
  updatePatient,
  deletePatient
};