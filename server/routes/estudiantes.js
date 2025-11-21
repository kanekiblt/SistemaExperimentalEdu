const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');

// Obtener todos los estudiantes
router.get('/', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    `SELECT e.*, a.nombres as apoderado_nombres, a.telefono, a.email as apoderado_email
     FROM estudiantes e
     LEFT JOIN apoderados a ON e.id = a.estudiante_id
     ORDER BY e.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Obtener estudiante por ID
router.get('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  database.get(
    `SELECT e.*, a.* FROM estudiantes e
     LEFT JOIN apoderados a ON e.id = a.estudiante_id
     WHERE e.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }
      res.json(row);
    }
  );
});

// Crear nuevo estudiante
router.post('/', authenticate, (req, res) => {
  const { dni, nombres, apellidos, fecha_nacimiento, nivel, grado, turno, apoderado } = req.body;

  if (!dni || !nombres || !apellidos || !fecha_nacimiento || !nivel) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const database = db.getDb();
  database.run(
    `INSERT INTO estudiantes (dni, nombres, apellidos, fecha_nacimiento, nivel, grado, turno)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dni, nombres, apellidos, fecha_nacimiento, nivel, grado, turno],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Si hay apoderado, insertarlo
      if (apoderado && this.lastID) {
        database.run(
          `INSERT INTO apoderados (estudiante_id, nombres, apellidos, dni, telefono, email, parentesco)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            this.lastID,
            apoderado.nombres,
            apoderado.apellidos,
            apoderado.dni,
            apoderado.telefono,
            apoderado.email,
            apoderado.parentesco || 'Padre'
          ]
        );
      }

      res.json({ id: this.lastID, message: 'Estudiante creado exitosamente' });
    }
  );
});

// Actualizar estudiante
router.put('/:id', authenticate, (req, res) => {
  const { nombres, apellidos, nivel, grado, turno, estado } = req.body;
  const database = db.getDb();

  database.run(
    `UPDATE estudiantes 
     SET nombres = ?, apellidos = ?, nivel = ?, grado = ?, turno = ?, estado = ?
     WHERE id = ?`,
    [nombres, apellidos, nivel, grado, turno, estado, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Estudiante actualizado exitosamente' });
    }
  );
});

module.exports = router;

