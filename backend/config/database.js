const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
let db;
let pgPool;

if (isProduction && process.env.DATABASE_URL) {
  console.log('Mode Production : Connexion à PostgreSQL...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Requis pour Render
    }
  });
} else {
  console.log('Mode Développement : Utilisation de SQLite...');
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erreur de connexion à SQLite:', err.message);
    }
  });
}

/**
 * Traduit une requête de style MySQL/SQLite (?) vers style PostgreSQL ($1, $2...)
 */
const translateQuery = (query, params) => {
  if (!pgPool) return { query, params };
  let counter = 1;
  const pgQueryStr = query.replace(/\?/g, () => `$${counter++}`);
  return { query: pgQueryStr, params };
};

const pool = {
  execute: async (query, params = []) => {
    // Correction de compatibilité DATETIME('now') -> CURRENT_TIMESTAMP
    const normalizedQuery = query.replace(/DATETIME\('now'\)/gi, 'CURRENT_TIMESTAMP');

    if (pgPool) {
      const { query: pgQueryStr, params: pgParams } = translateQuery(normalizedQuery, params);
      const res = await pgPool.query(pgQueryStr, pgParams);
      return [res.rows, res.fields];
    }

    return new Promise((resolve, reject) => {
      const queryLower = normalizedQuery.toLowerCase().trim();
      if (queryLower.startsWith('insert')) {
        db.run(normalizedQuery, params, function(err) {
          if (err) reject(err);
          else resolve([{ insertId: this.lastID }]);
        });
      } else if (queryLower.startsWith('update') || queryLower.startsWith('delete')) {
        db.run(normalizedQuery, params, function(err) {
          if (err) reject(err);
          else resolve([{ affectedRows: this.changes }]);
        });
      } else {
        db.all(normalizedQuery, params, (err, rows) => {
          if (err) reject(err);
          else resolve([rows]);
        });
      }
    });
  },
  query: async (query, params = []) => {
    return pool.execute(query, params);
  }
};

module.exports = pool;