const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('./auth');

// Obtener todos los proyectos (público)
router.get('/', (req, res) => {
  const database = db.getDb();
  const destacados = req.query.destacados === 'true';
  
  let query = `SELECT * FROM proyectos_colegio WHERE estado = 'activo'`;
  if (destacados) {
    query += ` AND destacado = 1`;
  }
  query += ` ORDER BY destacado DESC, created_at DESC`;

  database.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener todos los logros (público)
router.get('/logros', (req, res) => {
  const database = db.getDb();
  const destacados = req.query.destacados === 'true';
  
  let query = `SELECT * FROM logros_colegio WHERE 1=1`;
  if (destacados) {
    query += ` AND destacado = 1`;
  }
  query += ` ORDER BY destacado DESC, fecha DESC`;

  database.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear proyecto (solo admin/director)
router.post('/', authenticate, (req, res) => {
  const { titulo, descripcion, categoria, fecha_inicio, fecha_fin, destacado } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT INTO proyectos_colegio (titulo, descripcion, categoria, fecha_inicio, fecha_fin, destacado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, categoria, fecha_inicio, fecha_fin, destacado ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Proyecto creado exitosamente' });
    }
  );
});

// Crear logro (solo admin/director)
router.post('/logros', authenticate, (req, res) => {
  const { titulo, descripcion, categoria, estudiantes, fecha, destacado } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT INTO logros_colegio (titulo, descripcion, categoria, estudiantes, fecha, destacado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, categoria, estudiantes, fecha, destacado ? 1 : 0],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Logro registrado exitosamente' });
    }
  );
});

module.exports = router;

