const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');

// Obtener todas las vacantes
router.get('/', (req, res) => {
  const año_academico = req.query.año || new Date().getFullYear().toString();
  const database = db.getDb();
  
  database.all(
    `SELECT * FROM vacantes WHERE año_academico = ? ORDER BY nivel, grado, turno`,
    [año_academico],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Crear/actualizar vacantes
router.post('/', authenticate, (req, res) => {
  const { año_academico, nivel, grado, turno, total } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT OR REPLACE INTO vacantes (año_academico, nivel, grado, turno, total, disponibles)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [año_academico, nivel, grado, turno, total, total],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Vacantes configuradas' });
    }
  );
});

module.exports = router;

