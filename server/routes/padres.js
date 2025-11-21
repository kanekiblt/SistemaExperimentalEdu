const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Consultar estado de matrícula (público con DNI)
router.post('/consulta', (req, res) => {
  const { estudiante_dni, apoderado_dni } = req.body;
  const database = db.getDb();

  if (!estudiante_dni && !apoderado_dni) {
    return res.status(400).json({ error: 'Debe proporcionar DNI del estudiante o apoderado' });
  }

  let query = `
    SELECT m.*, e.nombres, e.apellidos, e.dni, a.nombres as apoderado_nombres, a.telefono, a.email
    FROM matriculas m
    JOIN estudiantes e ON m.estudiante_id = e.id
    LEFT JOIN apoderados a ON e.id = a.estudiante_id
    WHERE 1=1
  `;
  const params = [];

  if (estudiante_dni) {
    query += ' AND e.dni = ?';
    params.push(estudiante_dni);
  }

  if (apoderado_dni) {
    query += ' AND a.dni = ?';
    params.push(apoderado_dni);
  }

  database.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear consulta
router.post('/consulta/nueva', (req, res) => {
  const { apoderado_dni, estudiante_dni, tipo_consulta, mensaje } = req.body;
  const database = db.getDb();

  database.run(
    `INSERT INTO consultas_padres (apoderado_dni, estudiante_dni, tipo_consulta, mensaje)
     VALUES (?, ?, ?, ?)`,
    [apoderado_dni, estudiante_dni, tipo_consulta, mensaje],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Consulta registrada' });
    }
  );
});

module.exports = router;

