const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { nom, email, mot_de_passe, role, statut_compte = 'en_attente' } = userData;
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, statut_compte) VALUES (?, ?, ?, ?, ?)',
      [nom, email, hashedPassword, role, statut_compte]
    );
    
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, nom, email, role, statut_compte, created_at FROM utilisateurs WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findAll() {
    const [rows] = await pool.execute(
      'SELECT id, nom, email, role, statut_compte, created_at FROM utilisateurs ORDER BY created_at DESC'
    );
    return rows;
  }

  static async findByStatus(statut_compte) {
    const [rows] = await pool.execute(
      'SELECT id, nom, email, role, statut_compte, created_at FROM utilisateurs WHERE statut_compte = ? ORDER BY created_at DESC',
      [statut_compte]
    );
    return rows;
  }

  static async update(id, userData) {
    const { nom, email, role, statut_compte } = userData;
    await pool.execute(
      'UPDATE utilisateurs SET nom = ?, email = ?, role = ?, statut_compte = ? WHERE id = ?',
      [nom, email, role, statut_compte, id]
    );
  }

  static async validateAccount(id, valide_par_id) {
    await pool.execute(
      'UPDATE utilisateurs SET statut_compte = ?, date_validation = DATETIME(\'now\'), valide_par_id = ? WHERE id = ?',
      ['actif', valide_par_id, id]
    );
  }

  static async rejectAccount(id) {
    await pool.execute(
      'UPDATE utilisateurs SET statut_compte = ?, date_validation = DATETIME(\'now\') WHERE id = ?',
      ['bloque', id]
    );
  }

  static async delete(id) {
    await pool.execute('DELETE FROM utilisateurs WHERE id = ?', [id]);
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }

  static async setResetToken(email, token, expires) {
    await pool.execute(
      'UPDATE utilisateurs SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email]
    );
  }

  static async findByResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM utilisateurs WHERE reset_token = ? AND reset_token_expires > DATETIME("now")',
      [token]
    );
    return rows[0];
  }

  static async clearResetToken(id) {
    await pool.execute(
      'UPDATE utilisateurs SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [id]
    );
  }
}

module.exports = User;
