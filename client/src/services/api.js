import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify')
};

export const estudiantesService = {
  getAll: () => api.get('/estudiantes'),
  getById: (id) => api.get(`/estudiantes/${id}`),
  create: (data) => api.post('/estudiantes', data),
  update: (id, data) => api.put(`/estudiantes/${id}`, data)
};

export const matriculaService = {
  getAll: () => api.get('/matricula'),
  getById: (id) => api.get(`/matricula/${id}`),
  inscripcion: (data) => api.post('/matricula/inscripcion', data),
  matriculaManual: (data) => api.post('/matricula/manual', data),
  updateEstado: (id, estado, documentosCompletos) => 
    api.put(`/matricula/${id}/estado`, { estado, documentos_completos: documentosCompletos }),
  ratificacion: (añoAcademico) => 
    api.post('/matricula/ratificacion', { año_academico: añoAcademico }),
  ratificacionIndividual: (estudianteId, añoAcademico) => 
    api.post('/matricula/ratificacion/individual', { estudiante_id: estudianteId, año_academico: añoAcademico })
};

export const vacantesService = {
  getAll: (año) => api.get('/vacantes', { params: { año } }),
  create: (data) => api.post('/vacantes', data)
};

export const dashboardService = {
  getEstadisticas: (año) => api.get('/dashboard/estadisticas', { params: { año } }),
  getMatriculasRecientes: () => api.get('/dashboard/matriculas-recientes'),
  getMatriculados: (año) => api.get('/dashboard/matriculados', { params: { año } })
};

export const finanzasService = {
  getIngresosMensual: (año, mes) => api.get('/finanzas/ingresos/mensual', { params: { año, mes } }),
  getIngresosAnual: (año) => api.get('/finanzas/ingresos/anual', { params: { año } }),
  getEgresosMensual: (año, mes) => api.get('/finanzas/egresos/mensual', { params: { año, mes } }),
  getEgresosAnual: (año) => api.get('/finanzas/egresos/anual', { params: { año } }),
  getResumen: (año, mes) => api.get('/finanzas/resumen', { params: { año, mes } }),
  createEgreso: (data) => api.post('/finanzas/egresos', data),
  getEgresos: () => api.get('/finanzas/egresos')
};

export const notificacionesService = {
  getAll: () => api.get('/notificaciones'),
  enviar: (data) => api.post('/notificaciones/enviar', data),
  testEmail: (email, asunto, mensaje) => 
    api.post('/notificaciones/enviar', {
      destinatario: email,
      tipo: 'general',
      canal: 'email',
      mensaje,
      asunto
    })
};

export const documentosService = {
  getConstancia: (matriculaId) => 
    api.get(`/documentos/constancia/${matriculaId}`, { responseType: 'blob' })
};

export const planificacionService = {
  getAll: () => api.get('/planificacion'),
  create: (data) => api.post('/planificacion', data),
  aprobar: (id) => api.put(`/planificacion/${id}/aprobar`)
};

export const convocatoriasService = {
  getAll: () => api.get('/convocatorias'),
  create: (data) => api.post('/convocatorias', data),
  update: (id, data) => api.put(`/convocatorias/${id}`, data)
};

export const padresService = {
  consulta: (data) => api.post('/padres/consulta', data),
  nuevaConsulta: (data) => api.post('/padres/consulta/nueva', data)
};

export const proyectosService = {
  getAll: (destacados) => api.get('/proyectos', { params: { destacados } }),
  getLogros: (destacados) => api.get('/proyectos/logros', { params: { destacados } }),
  create: (data) => api.post('/proyectos', data),
  createLogro: (data) => api.post('/proyectos/logros', data)
};

export const diagnosticoService = {
  email: () => api.get('/diagnostico/email')
};

export default api;

