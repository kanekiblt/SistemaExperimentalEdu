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

// Obtener todas las planificaciones
router.get('/', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    `SELECT p.*, u1.nombre as creado_por_nombre, u2.nombre as aprobado_por_nombre
     FROM planificacion_matricula p
     LEFT JOIN usuarios u1 ON p.creado_por = u1.id
     LEFT JOIN usuarios u2 ON p.aprobado_por = u2.id
     ORDER BY p.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Crear planificación (Director)
router.post('/', authenticate, requireRole(['director', 'admin']), (req, res) => {
  const { año_academico, fecha_inicio, fecha_fin, observaciones } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT INTO planificacion_matricula (año_academico, fecha_inicio, fecha_fin, estado, creado_por, observaciones)
     VALUES (?, ?, ?, 'borrador', ?, ?)`,
    [año_academico, fecha_inicio, fecha_fin, req.user.id, observaciones],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Planificación creada' });
    }
  );
});

// Aprobar planificación (Director)
router.put('/:id/aprobar', authenticate, requireRole(['director', 'admin']), (req, res) => {
  const database = db.getDb();
  database.run(
    `UPDATE planificacion_matricula 
     SET estado = 'aprobado', aprobado_por = ?, fecha_aprobacion = datetime('now')
     WHERE id = ?`,
    [req.user.id, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Planificación aprobada' });
    }
  );
});

module.exports = router;

