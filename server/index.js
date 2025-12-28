const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/auth');
const estudiantesRoutes = require('./routes/estudiantes');
const matriculaRoutes = require('./routes/matricula');
const notificacionesRoutes = require('./routes/notificaciones');
const dashboardRoutes = require('./routes/dashboard');
const documentosRoutes = require('./routes/documentos');
const vacantesRoutes = require('./routes/vacantes');
const planificacionRoutes = require('./routes/planificacion');
const convocatoriasRoutes = require('./routes/convocatorias');
const padresRoutes = require('./routes/padres');
const diagnosticoRoutes = require('./routes/diagnostico');
const finanzasRoutes = require('./routes/finanzas');
const proyectosRoutes = require('./routes/proyectos');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/matricula', matriculaRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/vacantes', vacantesRoutes);
app.use('/api/planificacion', planificacionRoutes);
app.use('/api/convocatorias', convocatoriasRoutes);
app.use('/api/padres', padresRoutes);
app.use('/api/diagnostico', diagnosticoRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/proyectos', proyectosRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistema de Matrícula UNS funcionando' });
});

// Inicializar base de datos
const db = require('./config/database');
db.init();

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Sistema de Matrícula - Colegio Experimental UNS`);
});

