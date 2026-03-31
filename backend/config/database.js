const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données SQLite:', err.message);
  } else {
    console.log('Connecté à la base de données SQLite.');
  }
});

// Wrapper pour maintenir la compatibilité avec les requêtes async/await
const pool = {
  execute: (query, params = []) => {
    return new Promise((resolve, reject) => {
      const queryLower = query.toLowerCase().trim();
      
      if (queryLower.startsWith('insert')) {
        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve([{ insertId: this.lastID }]);
          }
        });
      } else if (queryLower.startsWith('update') || queryLower.startsWith('delete')) {
        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve([{ affectedRows: this.changes }]);
          }
        });
      } else {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve([rows]);
          }
        });
      }
    });
  },
  query: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve([rows]);
        }
      });
    });
  }
};

module.exports = pool;