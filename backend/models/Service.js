const pool = require('../config/database');

class Service {
  static async create(serviceData) {
    const { nom, description } = serviceData;
    
    const [result] = await pool.execute(
      'INSERT INTO services (nom, description) VALUES (?, ?)',
      [nom, description]
    );
    
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByName(nom) {
    const [rows] = await pool.execute(
      'SELECT * FROM services WHERE nom = ?',
      [nom]
    );
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM services ORDER BY nom'
    );
    return rows;
  }

  static async update(id, serviceData) {
    const { nom, description } = serviceData;
    await pool.execute(
      'UPDATE services SET nom = ?, description = ? WHERE id = ?',
      [nom, description, id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM services WHERE id = ?', [id]);
  }
}

module.exports = Service;
