const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const nodemailer = require('nodemailer');

// Endpoint de diagnóstico de email
router.get('/email', authenticate, (req, res) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || 587;

  const diagnostico = {
    configurado: false,
    detalles: {},
    errores: []
  };

  // Verificar si está configurado
  if (!smtpUser || !smtpPass || smtpUser === 'uns.matricula@gmail.com' || smtpPass === 'password') {
    diagnostico.errores.push('SMTP_USER o SMTP_PASS no están configurados correctamente');
    diagnostico.detalles = {
      SMTP_USER: smtpUser || 'NO CONFIGURADO',
      SMTP_PASS: smtpPass ? '***' : 'NO CONFIGURADO',
      SMTP_HOST: smtpHost,
      SMTP_PORT: smtpPort
    };
    return res.json(diagnostico);
  }

  diagnostico.configurado = true;
  diagnostico.detalles = {
    SMTP_USER: smtpUser,
    SMTP_PASS: '***',
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort
  };

  // Intentar verificar conexión
  const testTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  testTransporter.verify(function (error, success) {
    if (error) {
      diagnostico.errores.push(error.message);
      if (error.code === 'EAUTH') {
        diagnostico.errores.push('Error de autenticación. Verifica que uses una App Password de Gmail');
      }
      res.json(diagnostico);
    } else {
      diagnostico.mensaje = 'Configuración correcta. El servidor SMTP está listo.';
      res.json(diagnostico);
    }
  });
});

module.exports = router;

