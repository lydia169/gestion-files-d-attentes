const pool = require('../config/database');

class Patient {
  static async create(patientData) {
    const { nom, prenom, date_naissance, telephone, adresse } = patientData;
    
    const [result] = await pool.execute(
      'INSERT INTO patients (nom, prenom, date_naissance, telephone, adresse) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, date_naissance, telephone, adresse]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM patients WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM patients ORDER BY created_at DESC'
    );
    return rows;
  }

  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.execute(
      'SELECT * FROM patients WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ?',
      [searchTerm, searchTerm, searchTerm]
    );
    return rows;
  }

  static async findByPhoneAndBirthDate(telephone, date_naissance) {
    const [rows] = await pool.execute(
      'SELECT * FROM patients WHERE telephone = ? AND date_naissance = ?',
      [telephone, date_naissance]
    );
    return rows[0];
  }

  static async update(id, patientData) {
    const { nom, prenom, date_naissance, telephone, adresse } = patientData;
    await pool.execute(
      'UPDATE patients SET nom = ?, prenom = ?, date_naissance = ?, telephone = ?, adresse = ? WHERE id = ?',
      [nom, prenom, date_naissance, telephone, adresse, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
  }
}

module.exports = Patient;