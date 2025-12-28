import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { planificacionService, matriculaService, dashboardService, estudiantesService, notificacionesService, diagnosticoService } from '../services/api';
import './PortalDirector.css';

const PortalDirector = () => {
  const [activeTab, setActiveTab] = useState('planificacion');
  const [planificaciones, setPlanificaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [showPlanificacionForm, setShowPlanificacionForm] = useState(false);
  const [showMatriculaForm, setShowMatriculaForm] = useState(false);
  const [formData, setFormData] = useState({
    año_academico: new Date().getFullYear().toString(),
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: ''
  });
  const [matriculaData, setMatriculaData] = useState({
    estudiante_id: '',
    año_academico: new Date().getFullYear().toString(),
    nivel: '',
    grado: '',
    turno: '',
    pension: 0,
    numero_voucher: ''
  });
  const [emailTest, setEmailTest] = useState({
    destinatario: 'mirian2demayo@gmail.com',
    asunto: 'Notificación - Sistema de Matrícula UNS',
    mensaje: 'Este es un correo de prueba del sistema de matrícula del Colegio Experimental UNS.'
  });
  const [emailsDestinatarios] = useState([
    { email: 'mirian2demayo@gmail.com', nombre: 'Mirian (Apoderado)' },
    { email: 'kanekk0902@gmail.com', nombre: 'Kane (Apoderado)' },
    { email: 'antonyboyer980@gmail.com', nombre: 'Antony (Prueba)' }
  ]);
  const [diagnosticoEmail, setDiagnosticoEmail] = useState(null);
  const [loadingDiagnostico, setLoadingDiagnostico] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [planRes, statsRes, estRes] = await Promise.all([
        planificacionService.getAll(),
        dashboardService.getEstadisticas(new Date().getFullYear().toString()),
        estudiantesService.getAll()
      ]);
      setPlanificaciones(planRes.data);
      setEstadisticas(statsRes.data);
      setEstudiantes(estRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const handleCrearPlanificacion = async (e) => {
    e.preventDefault();
    try {
      await planificacionService.create(formData);
      toast.success('Planificación creada');
      setShowPlanificacionForm(false);
      loadData();
    } catch (error) {
      toast.error('Error al crear planificación');
    }
  };

  const handleAprobar = async (id) => {
    if (window.confirm('¿Desea aprobar esta planificación?')) {
      try {
        await planificacionService.aprobar(id);
        toast.success('Planificación aprobada');
        loadData();
      } catch (error) {
        toast.error('Error al aprobar');
      }
    }
  };

  const handleRatificacion = async () => {
    if (window.confirm('¿Desea enviar las ratificaciones de permanencia a todos los estudiantes activos? Se incluirá el link al portal web.')) {
      try {
        const añoAcademico = new Date().getFullYear().toString();
        const response = await matriculaService.ratificacion(añoAcademico);
        toast.success(`Ratificación enviada a ${response.data.enviados} apoderados`);
        loadData();
      } catch (error) {
        toast.error('Error al enviar ratificaciones');
      }
    }
  };

  const handleRatificacionIndividual = async (estudianteId, nombreEstudiante) => {
    if (window.confirm(`¿Desea enviar ratificación de permanencia a ${nombreEstudiante}? Se incluirá el link al portal web.`)) {
      try {
        const añoAcademico = new Date().getFullYear().toString();
        const response = await matriculaService.ratificacionIndividual(estudianteId, añoAcademico);
        toast.success(`Ratificación enviada a ${response.data.estudiante}`);
        loadData();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Error al enviar ratificación');
      }
    }
  };

  const handleEnviarEmail = async (e) => {
    e.preventDefault();
    try {
      const response = await notificacionesService.enviar({
        destinatario: emailTest.destinatario,
        tipo: 'general',
        canal: 'email',
        mensaje: emailTest.mensaje,
        asunto: emailTest.asunto
      });
      toast.success(`✅ Email enviado exitosamente a ${emailTest.destinatario}`);
      console.log('Respuesta del servidor:', response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`❌ Error: ${errorMsg}`);
      console.error('Error completo:', error.response?.data || error);
    }
  };

  const handleMatricular = async (e) => {
    e.preventDefault();
    if (!matriculaData.estudiante_id) {
      toast.error('Debe seleccionar un estudiante');
      return;
    }

    try {
      await matriculaService.matriculaManual({
        estudiante_id: parseInt(matriculaData.estudiante_id),
        año_academico: matriculaData.año_academico,
        nivel: matriculaData.nivel,
        grado: matriculaData.grado,
        turno: matriculaData.turno,
        numero_voucher: matriculaData.numero_voucher || 'MANUAL'
      });

      toast.success('Matrícula creada exitosamente');
      setShowMatriculaForm(false);
      setMatriculaData({
        estudiante_id: '',
        año_academico: new Date().getFullYear().toString(),
        nivel: '',
        grado: '',
        turno: '',
        pension: 0,
        numero_voucher: ''
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear matrícula');
    }
  };

  return (
    <div className="container portal-director">
      <div className="portal-header">
        <h1>Portal del Director</h1>
        <p>Gestión y Planificación del Proceso de Matrícula</p>
      </div>

      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Estudiantes</h3>
          <p className="stat-number">{estadisticas?.totalEstudiantes || estudiantes.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Matrículas Pendientes</h3>
          <p className="stat-number">
            {estadisticas?.matriculasPorEstado?.find(e => e.estado === 'pendiente')?.cantidad || 0}
          </p>
        </div>
        <div className="stat-card">
          <h3>Matrículas Completadas</h3>
          <p className="stat-number">
            {estadisticas?.matriculasPorEstado?.find(e => e.estado === 'completado')?.cantidad || 0}
          </p>
        </div>
      </div>

      <div className="portal-tabs">
        <button
          className={activeTab === 'planificacion' ? 'active' : ''}
          onClick={() => setActiveTab('planificacion')}
        >
          Planificación
        </button>
        <button
          className={activeTab === 'estudiantes' ? 'active' : ''}
          onClick={() => setActiveTab('estudiantes')}
        >
          Estudiantes
        </button>
        <button
          className={activeTab === 'matricula' ? 'active' : ''}
          onClick={() => setActiveTab('matricula')}
        >
          Matrícula Manual
        </button>
        <button
          className={activeTab === 'email' ? 'active' : ''}
          onClick={() => setActiveTab('email')}
        >
          Enviar Email
        </button>
      </div>

      {activeTab === 'planificacion' && (
        <>
          <div className="actions-section">
            <button onClick={handleRatificacion} className="btn btn-primary btn-large">
              Enviar Ratificación de Permanencia
            </button>
            <button 
              onClick={() => setShowPlanificacionForm(!showPlanificacionForm)} 
              className="btn btn-success btn-large"
            >
              {showPlanificacionForm ? 'Cancelar' : 'Nueva Planificación'}
            </button>
          </div>

          {showPlanificacionForm && (
            <div className="card">
              <h2>Crear Planificación de Matrícula</h2>
              <form onSubmit={handleCrearPlanificacion}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Año Académico</label>
                    <input
                      type="text"
                      value={formData.año_academico}
                      onChange={(e) => setFormData({ ...formData, año_academico: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Fin</label>
                    <input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observaciones</label>
                  <textarea
                    rows="4"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Crear Planificación</button>
              </form>
            </div>
          )}

          <div className="card">
            <h2>Planificaciones de Matrícula</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Año Académico</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Creado Por</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planificaciones.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.año_academico}</td>
                    <td>{plan.fecha_inicio ? new Date(plan.fecha_inicio).toLocaleDateString() : '-'}</td>
                    <td>{plan.fecha_fin ? new Date(plan.fecha_fin).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge badge-${plan.estado === 'aprobado' ? 'success' : 'warning'}`}>
                        {plan.estado}
                      </span>
                    </td>
                    <td>{plan.creado_por_nombre || '-'}</td>
                    <td>
                      {plan.estado === 'borrador' && (
                        <button
                          onClick={() => handleAprobar(plan.id)}
                          className="btn btn-success"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Aprobar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'estudiantes' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Lista de Estudiantes</h2>
            <button onClick={handleRatificacion} className="btn btn-primary">
              Enviar Ratificación Masiva
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Nivel</th>
                <th>Grado</th>
                <th>Turno</th>
                <th>Apoderado</th>
                <th>Email Apoderado</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id}>
                  <td>{est.dni}</td>
                  <td>{est.nombres}</td>
                  <td>{est.apellidos}</td>
                  <td>{est.nivel}</td>
                  <td>{est.grado}</td>
                  <td>{est.turno}</td>
                  <td>{est.apoderado_nombres || '-'}</td>
                  <td>{est.apoderado_email || '-'}</td>
                  <td>{est.telefono || '-'}</td>
                  <td>
                    <span className={`badge badge-${est.estado === 'activo' ? 'success' : 'danger'}`}>
                      {est.estado}
                    </span>
                  </td>
                  <td>
                    {(est.apoderado_email || est.telefono) && (
                      <button
                        onClick={() => handleRatificacionIndividual(est.id, `${est.nombres} ${est.apellidos}`)}
                        className="btn btn-success"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                        title="Enviar ratificación individual con link al portal"
                      >
                        📧 Ratificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', fontSize: '14px' }}>
            <strong>💡 Nota:</strong> Las ratificaciones incluyen un link al portal web donde los padres pueden registrar a sus hijos.
            El link es: <a href="/padres" target="_blank" style={{ color: '#0066cc' }}>/padres</a>
          </div>
        </div>
      )}

      {activeTab === 'matricula' && (
        <div className="card">
          <h2>Matrícula Manual de Estudiante</h2>
          <button
            onClick={() => setShowMatriculaForm(!showMatriculaForm)}
            className="btn btn-primary"
            style={{ marginBottom: '20px' }}
          >
            {showMatriculaForm ? 'Cancelar' : 'Nueva Matrícula'}
          </button>

          {showMatriculaForm && (
            <form onSubmit={handleMatricular}>
              <div className="form-group">
                <label>Estudiante *</label>
                <select
                  value={matriculaData.estudiante_id}
                  onChange={(e) => {
                    const estudiante = estudiantes.find(est => est.id === parseInt(e.target.value));
                    setMatriculaData({
                      ...matriculaData,
                      estudiante_id: e.target.value,
                      nivel: estudiante?.nivel || '',
                      grado: estudiante?.grado || '',
                      turno: estudiante?.turno || '',
                      pension: estudiante?.nivel === 'Inicial' ? 130 : 180
                    });
                  }}
                  required
                >
                  <option value="">Seleccione un estudiante</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombres} {est.apellidos} - DNI: {est.dni}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Año Académico *</label>
                  <input
                    type="text"
                    value={matriculaData.año_academico}
                    onChange={(e) => setMatriculaData({ ...matriculaData, año_academico: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nivel *</label>
                  <select
                    value={matriculaData.nivel}
                    onChange={(e) => {
                      const pension = e.target.value === 'Inicial' ? 130 : 180;
                      setMatriculaData({ ...matriculaData, nivel: e.target.value, pension });
                    }}
                    required
                  >
                    <option value="">Seleccione</option>
                    <option>Inicial</option>
                    <option>Primaria</option>
                    <option>Secundaria</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Grado *</label>
                  <input
                    type="text"
                    value={matriculaData.grado}
                    onChange={(e) => setMatriculaData({ ...matriculaData, grado: e.target.value })}
                    required
                    placeholder="Ej: 1ro, 2do, 3ro..."
                  />
                </div>
                <div className="form-group">
                  <label>Turno *</label>
                  <select
                    value={matriculaData.turno}
                    onChange={(e) => setMatriculaData({ ...matriculaData, turno: e.target.value })}
                    required
                  >
                    <option value="">Seleccione</option>
                    <option>Mañana</option>
                    <option>Tarde</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Pensión Referencial</label>
                  <input
                    type="number"
                    value={matriculaData.pension}
                    readOnly
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                <div className="form-group">
                  <label>Número de Voucher</label>
                  <input
                    type="text"
                    value={matriculaData.numero_voucher}
                    onChange={(e) => setMatriculaData({ ...matriculaData, numero_voucher: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Crear Matrícula</button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'email' && (
        <div className="card">
          <h2>Enviar Email de Prueba</h2>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <button
              type="button"
              onClick={async () => {
                setLoadingDiagnostico(true);
                try {
                  const response = await diagnosticoService.email();
                  setDiagnosticoEmail(response.data);
                } catch (error) {
                  setDiagnosticoEmail({ errores: ['Error al obtener diagnóstico'] });
                } finally {
                  setLoadingDiagnostico(false);
                }
              }}
              className="btn btn-info"
              style={{ marginBottom: '10px' }}
            >
              {loadingDiagnostico ? 'Verificando...' : '🔍 Verificar Configuración de Email'}
            </button>
            
            {diagnosticoEmail && (
              <div style={{ marginTop: '15px' }}>
                {diagnosticoEmail.configurado ? (
                  <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                    ✅ {diagnosticoEmail.mensaje || 'Configuración correcta'}
                  </div>
                ) : (
                  <div style={{ color: '#dc3545' }}>
                    ❌ Email no configurado correctamente
                    <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                      {diagnosticoEmail.errores?.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {diagnosticoEmail.detalles && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    <strong>Configuración actual:</strong>
                    <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '3px', marginTop: '5px' }}>
                      {JSON.stringify(diagnosticoEmail.detalles, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '1px solid #0066cc' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0066cc' }}>
              📧 Configuración de Email
            </p>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
              <strong>Email de envío:</strong> antonyboyer980@gmail.com<br/>
              <strong>Destinatarios configurados:</strong> mirian2demayo@gmail.com, kanekk0902@gmail.com
            </p>
          </div>

          <p style={{ marginBottom: '20px', color: '#666' }}>
            Prueba el envío de emails a los destinatarios configurados.
          </p>
          <form onSubmit={handleEnviarEmail}>
            <div className="form-group">
              <label>Destinatario *</label>
              <select
                value={emailTest.destinatario}
                onChange={(e) => setEmailTest({ ...emailTest, destinatario: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              >
                {emailsDestinatarios.map((dest) => (
                  <option key={dest.email} value={dest.email}>
                    {dest.nombre} - {dest.email}
                  </option>
                ))}
              </select>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                O escribe otro email manualmente
              </small>
              <input
                type="email"
                value={emailTest.destinatario}
                onChange={(e) => setEmailTest({ ...emailTest, destinatario: e.target.value })}
                placeholder="O escribe otro email"
                style={{ marginTop: '10px' }}
              />
            </div>
            <div className="form-group">
              <label>Asunto *</label>
              <input
                type="text"
                value={emailTest.asunto}
                onChange={(e) => setEmailTest({ ...emailTest, asunto: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Mensaje *</label>
              <textarea
                rows="6"
                value={emailTest.mensaje}
                onChange={(e) => setEmailTest({ ...emailTest, mensaje: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Enviar Email</button>
          </form>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <p><strong>Nota:</strong> Para que el email funcione, configura las variables en el archivo <code>.env</code>:</p>
            <pre style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '3px', marginTop: '10px' }}>
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=antonyboyer980@gmail.com
SMTP_PASS=tu_app_password`}
            </pre>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong>Email de envío:</strong> antonyboyer980@gmail.com<br/>
              <strong>Destinatarios:</strong> mirian2demayo@gmail.com, kanekk0902@gmail.com<br/>
              Si usas Gmail con 2FA, necesitas generar una "App Password" en tu cuenta de Google.
            </p>
          </div>
          
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffc107' }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
              <strong>💡 Tip:</strong> Cuando envíes ratificaciones masivas, los emails se enviarán automáticamente a todos los apoderados registrados, incluyendo mirian2demayo@gmail.com y kanekk0902@gmail.com.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalDirector;

