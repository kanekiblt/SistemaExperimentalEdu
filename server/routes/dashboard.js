const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');

// Estadísticas generales
router.get('/estadisticas', authenticate, (req, res) => {
  const database = db.getDb();
  const año_academico = req.query.año || new Date().getFullYear().toString();

  const estadisticas = {};

  // Total de estudiantes
  database.get(
    'SELECT COUNT(*) as total FROM estudiantes WHERE estado = "activo"',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      estadisticas.totalEstudiantes = row.total;

      // Matrículas por estado
      database.all(
        `SELECT estado, COUNT(*) as cantidad 
         FROM matriculas 
         WHERE año_academico = ?
         GROUP BY estado`,
        [año_academico],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          estadisticas.matriculasPorEstado = rows;

          // Matrículas por nivel
          database.all(
            `SELECT nivel, COUNT(*) as cantidad 
             FROM matriculas 
             WHERE año_academico = ?
             GROUP BY nivel`,
            [año_academico],
            (err, rows) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              estadisticas.matriculasPorNivel = rows;

              // Vacantes disponibles
              database.all(
                `SELECT nivel, SUM(disponibles) as disponibles, SUM(ocupadas) as ocupadas, SUM(total) as total
                 FROM vacantes 
                 WHERE año_academico = ?
                 GROUP BY nivel`,
                [año_academico],
                (err, rows) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  estadisticas.vacantes = rows;

                  // Matrículas recientes (últimos 7 días)
                  database.all(
                    `SELECT COUNT(*) as cantidad 
                     FROM matriculas 
                     WHERE fecha_inscripcion >= datetime('now', '-7 days')`,
                    [],
                    (err, row) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      estadisticas.matriculasRecientes = row[0].cantidad;

                      res.json(estadisticas);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Matrículas recientes
router.get('/matriculas-recientes', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    `SELECT m.*, e.nombres, e.apellidos, e.dni
     FROM matriculas m
     JOIN estudiantes e ON m.estudiante_id = e.id
     ORDER BY m.fecha_inscripcion DESC
     LIMIT 10`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;

