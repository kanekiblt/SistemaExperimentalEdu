const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');

// Middleware para verificar rol
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
};

// Obtener todas las convocatorias (público para activas)
router.get('/', (req, res) => {
  const database = db.getDb();
  const soloActivas = !req.headers.authorization;
  
  const query = soloActivas
    ? `SELECT * FROM convocatorias WHERE estado = 'activa' AND publicada = 1 ORDER BY created_at DESC`
    : `SELECT * FROM convocatorias ORDER BY created_at DESC`;

  database.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear convocatoria (Secretaría)
router.post('/', authenticate, requireRole(['secretaria', 'admin']), (req, res) => {
  const { año_academico, titulo, descripcion, fecha_inicio, fecha_fin } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT INTO convocatorias (año_academico, titulo, descripcion, fecha_inicio, fecha_fin, estado, publicada)
     VALUES (?, ?, ?, ?, ?, 'activa', 1)`,
    [año_academico, titulo, descripcion, fecha_inicio, fecha_fin],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Convocatoria creada y publicada' });
    }
  );
});

// Actualizar convocatoria
router.put('/:id', authenticate, requireRole(['secretaria', 'admin']), (req, res) => {
  const { titulo, descripcion, fecha_inicio, fecha_fin, estado, publicada } = req.body;
  const database = db.getDb();

  database.run(
    `UPDATE convocatorias 
     SET titulo = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?, publicada = ?
     WHERE id = ?`,
    [titulo, descripcion, fecha_inicio, fecha_fin, estado, publicada ? 1 : 0, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Convocatoria actualizada' });
    }
  );
});

module.exports = router;

