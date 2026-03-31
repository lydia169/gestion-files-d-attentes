const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT * FROM services', [], (err, services) => {
  if (err) {
    console.error('Erreur services:', err.message);
  } else {
    console.log('=== SERVICES ===');
    console.log(JSON.stringify(services, null, 2));
  }
  
  // Check queue for each service
  db.all(`
    SELECT fa.*, p.nom, p.prenom, s.nom as service_nom
    FROM files_attente fa
    LEFT JOIN patients p ON fa.patient_id = p.id
    LEFT JOIN services s ON fa.service_id = s.id
    WHERE fa.statut IN ('en_attente', 'en_cours')
      AND (fa.date_available IS NULL OR fa.date_available <= DATETIME('now'))
    ORDER BY s.nom, fa.date_creation
  `, [], (err2, queue) => {
    if (err2) {
      console.error('Erreur queue:', err2.message);
    } else {
      console.log('\n=== FILE D\'ATTENTE (en_attente et en_cours) ===');
      console.log(queue.length > 0 ? JSON.stringify(queue, null, 2) : 'Aucun patient dans la file');
    }
    
    db.close();
  });
});