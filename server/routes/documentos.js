const express = require('express');
const router = express.Router();
const { authenticate } = require('./auth');
const documentosService = require('../services/documentos');

// Generar constancia de matrícula
router.get('/constancia/:matriculaId', authenticate, async (req, res) => {
  try {
    const pdfBuffer = await documentosService.generarConstancia(req.params.matriculaId);
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

