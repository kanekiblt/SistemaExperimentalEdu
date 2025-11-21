const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');
const notificacionesService = require('../services/notificaciones');

// Obtener todas las matrículas
router.get('/', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    `SELECT m.*, e.dni, e.nombres, e.apellidos, e.nivel, a.telefono, a.email
     FROM matriculas m
     JOIN estudiantes e ON m.estudiante_id = e.id
     LEFT JOIN apoderados a ON e.id = a.estudiante_id
     ORDER BY m.fecha_inscripcion DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Obtener matrícula por ID
router.get('/:id', authenticate, (req, res) => {
  const database = db.getDb();
  database.get(
    `SELECT m.*, e.*, a.*
     FROM matriculas m
     JOIN estudiantes e ON m.estudiante_id = e.id
     LEFT JOIN apoderados a ON e.id = a.estudiante_id
     WHERE m.id = ?`,
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Matrícula no encontrada' });
      }
      res.json(row);
    }
  );
});

// Matrícula manual (solo director/admin)
router.post('/manual', authenticate, (req, res) => {
  const { estudiante_id, año_academico, nivel, grado, turno, numero_voucher } = req.body;
  const database = db.getDb();

  if (!estudiante_id || !año_academico || !nivel) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Verificar que el estudiante existe
  database.get(
    'SELECT * FROM estudiantes WHERE id = ?',
    [estudiante_id],
    (err, estudiante) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!estudiante) {
        return res.status(404).json({ error: 'Estudiante no encontrado' });
      }

      const pension = nivel === 'Inicial' ? 130 : 180;

      database.run(
        `INSERT INTO matriculas 
         (estudiante_id, año_academico, nivel, grado, turno, pension, estado, numero_voucher, fecha_pago)
         VALUES (?, ?, ?, ?, ?, ?, 'completado', ?, datetime('now'))`,
        [estudiante_id, año_academico, nivel, grado, turno, pension, numero_voucher || 'MANUAL'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            id: this.lastID,
            message: 'Matrícula creada exitosamente'
          });
        }
      );
    }
  );
});

// Inscripción de matrícula (público)
router.post('/inscripcion', async (req, res) => {
  const {
    estudiante,
    apoderado,
    año_academico,
    nivel,
    grado,
    turno,
    numero_voucher
  } = req.body;

  if (!estudiante || !apoderado || !año_academico || !nivel) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const database = db.getDb();

  // Verificar disponibilidad de vacantes
  database.get(
    `SELECT disponibles FROM vacantes 
     WHERE año_academico = ? AND nivel = ? AND grado = ? AND turno = ?`,
    [año_academico, nivel, grado, turno],
    async (err, vacante) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!vacante || vacante.disponibles <= 0) {
        return res.status(400).json({ error: 'No hay vacantes disponibles' });
      }

      crearMatricula();

      function crearMatricula() {
        // Verificar si el estudiante ya existe
        database.get(
          'SELECT id FROM estudiantes WHERE dni = ?',
          [estudiante.dni],
          (err, estudianteExistente) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            let estudianteId = estudianteExistente?.id;

            // Si no existe, crearlo
            if (!estudianteId) {
              database.run(
                `INSERT INTO estudiantes (dni, nombres, apellidos, fecha_nacimiento, nivel, grado, turno)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  estudiante.dni,
                  estudiante.nombres,
                  estudiante.apellidos,
                  estudiante.fecha_nacimiento,
                  nivel,
                  grado,
                  turno
                ],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  estudianteId = this.lastID;

                  // Crear apoderado
                  database.run(
                    `INSERT INTO apoderados (estudiante_id, nombres, apellidos, dni, telefono, email, parentesco)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      estudianteId,
                      apoderado.nombres,
                      apoderado.apellidos,
                      apoderado.dni,
                      apoderado.telefono,
                      apoderado.email,
                      apoderado.parentesco || 'Padre'
                    ],
                    (err) => {
                      if (err) {
                        console.error('Error al crear apoderado:', err);
                      }
                    }
                  );

                  crearMatricula();
                }
              );
            } else {
              crearMatricula();
            }

            function crearMatricula() {
              // Obtener pensión según nivel
              const pension = nivel === 'Inicial' ? 130 : 180;

              // Crear matrícula
              database.run(
                `INSERT INTO matriculas 
                 (estudiante_id, año_academico, nivel, grado, turno, pension, estado, numero_voucher, fecha_pago)
                 VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, datetime('now'))`,
                [estudianteId, año_academico, nivel, grado, turno, pension, numero_voucher],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  // Actualizar vacantes
                  database.run(
                    `UPDATE vacantes 
                     SET ocupadas = ocupadas + 1, disponibles = disponibles - 1
                     WHERE año_academico = ? AND nivel = ? AND grado = ? AND turno = ?`,
                    [año_academico, nivel, grado, turno]
                  );

                  // Enviar notificación de confirmación (no bloquea si falla)
                  notificacionesService.enviarConfirmacionInscripcion(
                    apoderado.email,
                    apoderado.telefono,
                    estudiante.nombres + ' ' + estudiante.apellidos
                  ).catch(err => {
                    console.error('⚠️  Error al enviar confirmación (no crítico):', err.message);
                  });

                  res.json({
                    id: this.lastID,
                    message: 'Inscripción realizada exitosamente'
                  });
                }
              );
            }
          }
        );
      }
    }
  );
});

// Actualizar estado de matrícula
router.put('/:id/estado', authenticate, (req, res) => {
  const { estado, documentos_completos } = req.body;
  const database = db.getDb();

  database.run(
    `UPDATE matriculas 
     SET estado = ?, documentos_completos = ?
     WHERE id = ?`,
    [estado, documentos_completos ? 1 : 0, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Estado actualizado exitosamente' });
    }
  );
});

// Ratificación de permanencia (masiva)
router.post('/ratificacion', authenticate, async (req, res) => {
  const { año_academico } = req.body;
  const database = db.getDb();

  // Obtener todos los estudiantes activos del año anterior
  database.all(
    `SELECT e.*, a.email, a.telefono, a.nombres as apoderado_nombres
     FROM estudiantes e
     LEFT JOIN apoderados a ON e.id = a.estudiante_id
     WHERE e.estado = 'activo'`,
    [],
    async (err, estudiantes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      let enviados = 0;
      let errores = 0;
      
      for (const estudiante of estudiantes) {
        if (estudiante.email || estudiante.telefono) {
          try {
            const resultado = await notificacionesService.enviarRatificacion(
              estudiante.email,
              estudiante.telefono,
              estudiante.nombres + ' ' + estudiante.apellidos,
              año_academico
            );
            // Verificar si fue exitoso (puede retornar {success: false} sin lanzar error)
            if (resultado && resultado.success !== false) {
              enviados++;
            } else {
              errores++;
            }
          } catch (error) {
            console.error(`⚠️  Error al enviar ratificación a ${estudiante.email}:`, error.message);
            errores++;
          }
        }
      }

      res.json({
        message: `Ratificación procesada: ${enviados} enviados, ${errores} errores`,
        total: estudiantes.length,
        enviados,
        errores
      });
    }
  );
});

module.exports = router;
