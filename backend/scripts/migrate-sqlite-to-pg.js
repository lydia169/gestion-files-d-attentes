const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Charger .env si besoin
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sqlitePath = path.join(__dirname, '..', 'database.sqlite');
const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
  console.error('DATABASE_URL manquante dans .env');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(sqlitePath);
const pgPool = new Pool({
  connectionString: pgUrl,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('--- Phase 1 : Extraction SQLite ---');
    
    const tables = ['utilisateurs', 'patients', 'services', 'files_attente'];
    
    for (const table of tables) {
      console.log(`Migration de la table: ${table}...`);
      
      const rows = await new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM ${table}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      if (rows.length === 0) {
        console.log(`Table ${table} vide, passage à la suivante.`);
        continue;
      }

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnsStr = columns.join(', ');
      
      const insertQuery = `INSERT INTO ${table} (${columnsStr}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      for (const row of rows) {
        const values = columns.map(col => row[col]);
        await pgPool.query(insertQuery, values);
      }
      
      console.log(`✅ Table ${table} : ${rows.length} lignes migrées.`);
    }

    console.log('\n--- Migration terminée avec succès ! ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    process.exit(1);
  }
}

migrate();
