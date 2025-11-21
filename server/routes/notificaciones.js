const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const db = require('../config/database');
const notificacionesService = require('../services/notificaciones');

// Obtener todas las notificaciones
router.get('/', authenticate, (req, res) => {
  const database = db.getDb();
  database.all(
    'SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 100',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

router.post('/enviar', authenticate, async (req, res) => {
  const { destinatario, tipo, canal, mensaje, asunto } = req.body;

  if (!destinatario || !tipo || !canal || !mensaje) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    let resultado;
    if (canal === 'email') {
      resultado = await notificacionesService.enviarEmail(destinatario, mensaje, asunto || 'Notificación - Colegio Experimental UNS');
    } else if (canal === 'whatsapp') {
      resultado = await notificacionesService.enviarWhatsApp(destinatario, mensaje);
    } else {
      return res.status(400).json({ error: 'Canal no válido' });
    }

    res.json({ message: 'Notificación enviada', resultado });
  } catch (error) {
    console.error('Error en ruta /enviar:', error);
    res.status(500).json({ 
      error: error.message,
      detalles: 'Verifica la configuración SMTP en el archivo .env'
    });
  }
});

module.exports = router;

