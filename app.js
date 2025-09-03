// app.js
const express = require('express');
const path = require('path');
const db = require('./db'); // database connection

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.urlencoded({ extended: true })); // parse POST data
app.use(express.static(path.join(__dirname, 'base'))); // static files (css/js/images)

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Input Validation Function ---
// Only letters, numbers, spaces, and hyphens allowed
function validateInput(str) {
  const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\-\/]+$/;
  return regex.test(str);
}

// --- Routes ---

// Patient form
app.get('/patient', (req, res) => {
  db.query('SELECT Service_ID, nom_service FROM service', (err, results) => {
    if (err) {
      console.error('Error fetching services: ', err);
      return res.send('Error loading services');
    }
    res.render('patient', { services: results });
  });
});

// Doctor form
app.get('/docteur', (req, res) => {
  db.query('SELECT Service_ID, nom_service FROM service', (err, results) => {
    if (err) {
      console.error('Error fetching services: ', err);
      return res.send('Error loading services');
    }
    res.render('docteur', { services: results });
  });
});

// Service creation form (static)
app.get('/service', (req, res) => {
  res.sendFile(path.join(__dirname, 'base', 'service.html'));
});

// --- POST routes ---

// Add patient
app.post('/patient', (req, res) => {
  const { nom, prénom, age, situation, groupe, service } = req.body;

  // Validate text inputs
  if (!validateInput(nom) || !validateInput(prénom) || !validateInput(service)) {
    return res.send('Patient non enregistré : Input invalide détecté !');
  }

  const sql = `
    INSERT INTO patients (nom, prénom, age, situation_matrimoniale, groupe_sanguin, Service_ID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [nom, prénom, age, situation, groupe, service], (err, result) => {
    if (err) {
      console.error('Error inserting patient:', err);
      return res.send('Patient non enregistré : Erreur base de données !');
    }
    res.send('Patient ajouté avec succès !');
  });
});

// Add doctor
app.post('/docteur', (req, res) => {
  const { nom, prénom, matricule, service } = req.body;

  // Validate text inputs
  if (!validateInput(nom) || !validateInput(prénom) || !validateInput(service)) {
    return res.send('Doctor non enregistré : Input invalide détecté !');
  }

  // First, check if matricule already exists
  const checkSql = 'SELECT * FROM docteurs WHERE matricule = ?';
  db.query(checkSql, [matricule], (err, results) => {
    if (err) {
      console.error('Error checking matricule:', err);
      return res.send('Error checking matricule');
    }

    if (results.length > 0) {
      return res.send('Matricule déjà existant !');
    }

    // Insert doctor if matricule is unique
    const insertSql = `
      INSERT INTO docteurs (nom, prénom, matricule, Service_ID)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertSql, [nom, prénom, matricule, service], (err, result) => {
      if (err) {
        console.error('Error inserting doctor:', err);
        return res.send('Doctor non enregistré : Erreur base de données !');
      }
      res.send('Doctor ajouté avec succès !');
    });
  });
});

// Add service
app.post('/service', (req, res) => {
  const { nom_service } = req.body;

  if (!validateInput(nom_service)) {
    return res.send('Service non enregistré : Input invalide détecté !');
  }

  const sql = 'INSERT INTO service (nom_service) VALUES (?)';
  db.query(sql, [nom_service], (err, result) => {
    if (err) {
      console.error('Error inserting service:', err);
      return res.send('Service non enregistré : Erreur base de données !');
    }
    res.send('Service ajouté avec succès !');
  });
});

// Rapport page
app.get('/rapport', (req, res) => {
  const sql = `
    SELECT 
      s.nom_service AS Service,
      GROUP_CONCAT(DISTINCT CONCAT(d.nom, ' ', d.prénom) SEPARATOR ', ') AS Docteurs,
      GROUP_CONCAT(DISTINCT CONCAT(p.nom, ' ', p.prénom) SEPARATOR ', ') AS Patients
    FROM service s
    LEFT JOIN docteurs d ON d.Service_ID = s.Service_ID
    LEFT JOIN patients p ON p.Service_ID = s.Service_ID
    GROUP BY s.Service_ID
    ORDER BY s.nom_service;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching report:', err);
      return res.send('Erreur récupération rapport !');
    }

    // Ensure null/empty fields are displayed as "Empty"
    const sanitizedResults = results.map(r => ({
      Service: r.Service,
      Docteurs: r.Docteurs || 'Empty',
      Patients: r.Patients || 'Empty'
    }));

    res.render('rapport', { reports: sanitizedResults });
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://192.168.100.20:${PORT}`);
});
