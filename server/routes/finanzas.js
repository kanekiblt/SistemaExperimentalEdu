const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');

// Obtener ingresos mensuales
router.get('/ingresos/mensual', authenticate, (req, res) => {
  const { año, mes } = req.query;
  const database = db.getDb();

  const query = `
    SELECT 
      strftime('%Y-%m', fecha_pago) as periodo,
      SUM(pension) as total,
      COUNT(*) as cantidad
    FROM matriculas
    WHERE estado = 'completado' 
      AND fecha_pago IS NOT NULL
      ${año ? `AND strftime('%Y', fecha_pago) = ?` : ''}
      ${mes ? `AND strftime('%m', fecha_pago) = ?` : ''}
    GROUP BY strftime('%Y-%m', fecha_pago)
    ORDER BY periodo DESC
  `;

  const params = [];
  if (año) params.push(año);
  if (mes) params.push(mes.padStart(2, '0'));

  database.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener ingresos anuales
router.get('/ingresos/anual', authenticate, (req, res) => {
  const { año } = req.query;
  const database = db.getDb();

  let query = `
    SELECT 
      strftime('%Y', fecha_pago) as año,
      SUM(pension) as total,
      COUNT(*) as cantidad
    FROM matriculas
    WHERE estado = 'completado' 
      AND fecha_pago IS NOT NULL
  `;

  const params = [];
  if (año) {
    query += ` AND strftime('%Y', fecha_pago) = ?`;
    params.push(año);
  }

  query += ` GROUP BY strftime('%Y', fecha_pago) ORDER BY año DESC`;

  database.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener egresos mensuales
router.get('/egresos/mensual', authenticate, (req, res) => {
  const { año, mes } = req.query;
  const database = db.getDb();

  const query = `
    SELECT 
      strftime('%Y-%m', fecha) as periodo,
      SUM(monto) as total,
      COUNT(*) as cantidad
    FROM egresos
    WHERE 1=1
      ${año ? `AND strftime('%Y', fecha) = ?` : ''}
      ${mes ? `AND strftime('%m', fecha) = ?` : ''}
    GROUP BY strftime('%Y-%m', fecha)
    ORDER BY periodo DESC
  `;

  const params = [];
  if (año) params.push(año);
  if (mes) params.push(mes.padStart(2, '0'));

  database.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener egresos anuales
router.get('/egresos/anual', authenticate, (req, res) => {
  const { año } = req.query;
  const database = db.getDb();

  let query = `
    SELECT 
      strftime('%Y', fecha) as año,
      SUM(monto) as total,
      COUNT(*) as cantidad
    FROM egresos
    WHERE 1=1
  `;

  const params = [];
  if (año) {
    query += ` AND strftime('%Y', fecha) = ?`;
    params.push(año);
  }

  query += ` GROUP BY strftime('%Y', fecha) ORDER BY año DESC`;

  database.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Crear egreso
router.post('/egresos', authenticate, (req, res) => {
  const { concepto, monto, categoria, descripcion, fecha } = req.body;
  const database = db.getDb();

  if (!concepto || !monto || !fecha) {
    return res.status(400).json({ error: 'Concepto, monto y fecha son requeridos' });
  }

  database.run(
    `INSERT INTO egresos (concepto, monto, categoria, descripcion, fecha)
     VALUES (?, ?, ?, ?, ?)`,
    [concepto, monto, categoria || 'General', descripcion || '', fecha],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Egreso registrado exitosamente' });
    }
  );
});

// Obtener todos los egresos
router.get('/egresos', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    'SELECT * FROM egresos ORDER BY fecha DESC LIMIT 100',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Resumen financiero
router.get('/resumen', authenticate, (req, res) => {
  const { año, mes } = req.query;
  const database = db.getDb();
  const añoActual = año || new Date().getFullYear().toString();
  const mesActual = mes || (new Date().getMonth() + 1).toString();

  // Ingresos del mes
  database.get(
    `SELECT SUM(pension) as total, COUNT(*) as cantidad
     FROM matriculas
     WHERE estado = 'completado' 
       AND fecha_pago IS NOT NULL
       AND strftime('%Y', fecha_pago) = ?
       AND strftime('%m', fecha_pago) = ?`,
    [añoActual, mesActual.padStart(2, '0')],
    (err, ingresosMes) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Egresos del mes
      database.get(
        `SELECT SUM(monto) as total, COUNT(*) as cantidad
         FROM egresos
         WHERE strftime('%Y', fecha) = ?
           AND strftime('%m', fecha) = ?`,
        [añoActual, mesActual.padStart(2, '0')],
        (err, egresosMes) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Ingresos del año
          database.get(
            `SELECT SUM(pension) as total, COUNT(*) as cantidad
             FROM matriculas
             WHERE estado = 'completado' 
               AND fecha_pago IS NOT NULL
               AND strftime('%Y', fecha_pago) = ?`,
            [añoActual],
            (err, ingresosAño) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Egresos del año
              database.get(
                `SELECT SUM(monto) as total, COUNT(*) as cantidad
                 FROM egresos
                 WHERE strftime('%Y', fecha) = ?`,
                [añoActual],
                (err, egresosAño) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  const ingresosMesTotal = ingresosMes?.total || 0;
                  const egresosMesTotal = egresosMes?.total || 0;
                  const ingresosAñoTotal = ingresosAño?.total || 0;
                  const egresosAñoTotal = egresosAño?.total || 0;

                  res.json({
                    mes: {
                      ingresos: ingresosMesTotal,
                      egresos: egresosMesTotal,
                      balance: ingresosMesTotal - egresosMesTotal,
                      cantidadIngresos: ingresosMes?.cantidad || 0,
                      cantidadEgresos: egresosMes?.cantidad || 0
                    },
                    año: {
                      ingresos: ingresosAñoTotal,
                      egresos: egresosAñoTotal,
                      balance: ingresosAñoTotal - egresosAñoTotal,
                      cantidadIngresos: ingresosAño?.cantidad || 0,
                      cantidadEgresos: egresosAño?.cantidad || 0
                    },
                    periodo: {
                      año: añoActual,
                      mes: mesActual
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;

