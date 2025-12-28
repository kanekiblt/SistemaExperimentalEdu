import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { padresService, convocatoriasService, proyectosService } from '../services/api';
import Inscripcion from './Inscripcion';
import './PortalPadres.css';

const PortalPadres = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [convocatorias, setConvocatorias] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [logros, setLogros] = useState([]);
  const [consultaData, setConsultaData] = useState({
    estudiante_dni: '',
    apoderado_dni: ''
  });
  const [matriculas, setMatriculas] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [convRes, proyRes, logrosRes] = await Promise.all([
        convocatoriasService.getAll(),
        proyectosService.getAll(),
        proyectosService.getLogros()
      ]);
      setConvocatorias(convRes.data.filter(c => c.estado === 'activa' && c.publicada));
      setProyectos(proyRes.data);
      setLogros(logrosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleConsulta = async (e) => {
    e.preventDefault();
    if (!consultaData.estudiante_dni && !consultaData.apoderado_dni) {
      toast.error('Debe proporcionar al menos un DNI');
      return;
    }

    try {
      const response = await padresService.consulta(consultaData);
      setMatriculas(response.data);
      if (response.data.length === 0) {
        toast.info('No se encontraron matrículas con los datos proporcionados');
      } else {
        toast.success('Consulta realizada exitosamente');
      }
    } catch (error) {
      toast.error('Error al consultar');
    }
  };

  const proyectosDestacados = proyectos.filter(p => p.destacado === 1).slice(0, 3);
  const logrosDestacados = logros.filter(l => l.destacado === 1).slice(0, 4);

  return (
    <div className="portal-padres">
      <div className="portal-padres-header">
        <h1>Colegio Experimental UNS</h1>
        <h2>Portal de Padres de Familia</h2>
        <p>Bienvenido a nuestro sistema de matrícula y información escolar</p>
      </div>

      <div className="portal-padres-nav">
        <button
          className={activeTab === 'inicio' ? 'active' : ''}
          onClick={() => setActiveTab('inicio')}
        >
          🏠 Inicio
        </button>
        <button
          className={activeTab === 'inscripcion' ? 'active' : ''}
          onClick={() => setActiveTab('inscripcion')}
        >
          📝 Inscripción
        </button>
        <button
          className={activeTab === 'consulta' ? 'active' : ''}
          onClick={() => setActiveTab('consulta')}
        >
          🔍 Consultar Estado
        </button>
        <button
          className={activeTab === 'proyectos' ? 'active' : ''}
          onClick={() => setActiveTab('proyectos')}
        >
          🎯 Proyectos
        </button>
        <button
          className={activeTab === 'logros' ? 'active' : ''}
          onClick={() => setActiveTab('logros')}
        >
          🏆 Logros
        </button>
        <button
          className={activeTab === 'convocatorias' ? 'active' : ''}
          onClick={() => setActiveTab('convocatorias')}
        >
          📢 Convocatorias
        </button>
      </div>

      <div className="portal-padres-content">
        {activeTab === 'inicio' && (
          <div className="inicio-section">
            {/* Hero Section */}
            <div className="hero-banner">
              <div className="hero-content">
                <h2>Bienvenidos al Colegio Experimental UNS</h2>
                <p>Formando líderes del mañana con excelencia académica y valores</p>
                <a href="#inscripcion" onClick={() => setActiveTab('inscripcion')} className="hero-button">
                  Inscribir a mi Hijo/a
                </a>
              </div>
            </div>

            {/* Proyectos Destacados */}
            <div className="section-title">
              <h2>🎯 Proyectos en Curso</h2>
              <button onClick={() => setActiveTab('proyectos')} className="ver-todo-btn">Ver Todos</button>
            </div>
            <div className="proyectos-grid">
              {proyectosDestacados.map((proyecto) => (
                <div key={proyecto.id} className="proyecto-card">
                  <div className="proyecto-badge">{proyecto.categoria}</div>
                  <h3>{proyecto.titulo}</h3>
                  <p>{proyecto.descripcion}</p>
                  <div className="proyecto-fecha">
                    {proyecto.fecha_inicio && new Date(proyecto.fecha_inicio).toLocaleDateString('es-PE', { month: 'long', day: 'numeric' })}
                    {proyecto.fecha_fin && ` - ${new Date(proyecto.fecha_fin).toLocaleDateString('es-PE', { month: 'long', day: 'numeric' })}`}
                  </div>
                </div>
              ))}
            </div>

            {/* Logros Destacados */}
            <div className="section-title">
              <h2>🏆 Logros y Reconocimientos</h2>
              <button onClick={() => setActiveTab('logros')} className="ver-todo-btn">Ver Todos</button>
            </div>
            <div className="logros-grid">
              {logrosDestacados.map((logro) => (
                <div key={logro.id} className="logro-card">
                  <div className="logro-icon">🏆</div>
                  <div className="logro-content">
                    <h3>{logro.titulo}</h3>
                    <p>{logro.descripcion}</p>
                    <div className="logro-info">
                      <span className="logro-estudiantes">👥 {logro.estudiantes}</span>
                      <span className="logro-fecha">
                        {new Date(logro.fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Convocatorias Activas */}
            {convocatorias.length > 0 && (
              <>
                <div className="section-title">
                  <h2>📢 Convocatorias Activas</h2>
                </div>
                <div className="convocatorias-list">
                  {convocatorias.slice(0, 2).map((conv) => (
                    <div key={conv.id} className="convocatoria-card-featured">
                      <h3>{conv.titulo}</h3>
                      <p>{conv.descripcion}</p>
                      <div className="convocatoria-dates">
                        <span>📅 {new Date(conv.fecha_inicio).toLocaleDateString()} - {new Date(conv.fecha_fin).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Accesos Rápidos</h2>
              <div className="actions-grid">
                <button onClick={() => setActiveTab('inscripcion')} className="action-card">
                  <div className="action-icon">📝</div>
                  <h3>Inscripción</h3>
                  <p>Registra a tu hijo/a</p>
                </button>
                <button onClick={() => setActiveTab('consulta')} className="action-card">
                  <div className="action-icon">🔍</div>
                  <h3>Consultar Estado</h3>
                  <p>Ver estado de matrícula</p>
                </button>
                <button onClick={() => setActiveTab('proyectos')} className="action-card">
                  <div className="action-icon">🎯</div>
                  <h3>Proyectos</h3>
                  <p>Ver proyectos del colegio</p>
                </button>
                <button onClick={() => setActiveTab('logros')} className="action-card">
                  <div className="action-icon">🏆</div>
                  <h3>Logros</h3>
                  <p>Reconocimientos obtenidos</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inscripcion' && (
          <div className="inscripcion-section">
            <Inscripcion />
          </div>
        )}

        {activeTab === 'consulta' && (
          <div className="consulta-section">
            <div className="card">
              <h2>Consultar Estado de Matrícula</h2>
              <p>Ingrese el DNI del estudiante o del apoderado para consultar el estado de la matrícula.</p>
              
              <form onSubmit={handleConsulta} className="consulta-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>DNI del Estudiante</label>
                    <input
                      type="text"
                      value={consultaData.estudiante_dni}
                      onChange={(e) => setConsultaData({ ...consultaData, estudiante_dni: e.target.value })}
                      placeholder="Ej: 12345678"
                    />
                  </div>
                  <div className="form-group">
                    <label>DNI del Apoderado</label>
                    <input
                      type="text"
                      value={consultaData.apoderado_dni}
                      onChange={(e) => setConsultaData({ ...consultaData, apoderado_dni: e.target.value })}
                      placeholder="Ej: 87654321"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Consultar</button>
              </form>

              {matriculas.length > 0 && (
                <div className="resultados-consulta">
                  <h3>Resultados de la Consulta</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>DNI</th>
                        <th>Nivel</th>
                        <th>Estado</th>
                        <th>Fecha Inscripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.map((mat) => (
                        <tr key={mat.id}>
                          <td>{mat.nombres} {mat.apellidos}</td>
                          <td>{mat.dni}</td>
                          <td>{mat.nivel}</td>
                          <td>
                            <span className={`badge badge-${mat.estado === 'completado' ? 'success' : mat.estado === 'pendiente' ? 'warning' : 'info'}`}>
                              {mat.estado}
                            </span>
                          </td>
                          <td>{new Date(mat.fecha_inscripcion).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'proyectos' && (
          <div className="proyectos-section">
            <div className="card">
              <h2>Proyectos y Actividades del Colegio</h2>
              <div className="proyectos-full-grid">
                {proyectos.map((proyecto) => (
                  <div key={proyecto.id} className="proyecto-card-full">
                    <div className="proyecto-header">
                      <span className="proyecto-categoria-badge">{proyecto.categoria}</span>
                      {proyecto.destacado === 1 && <span className="destacado-badge">⭐ Destacado</span>}
                    </div>
                    <h3>{proyecto.titulo}</h3>
                    <p>{proyecto.descripcion}</p>
                    <div className="proyecto-footer">
                      <span className="proyecto-fecha">
                        📅 {proyecto.fecha_inicio && new Date(proyecto.fecha_inicio).toLocaleDateString('es-PE')}
                        {proyecto.fecha_fin && ` - ${new Date(proyecto.fecha_fin).toLocaleDateString('es-PE')}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logros' && (
          <div className="logros-section">
            <div className="card">
              <h2>Logros y Reconocimientos</h2>
              <div className="logros-full-list">
                {logros.map((logro) => (
                  <div key={logro.id} className="logro-card-full">
                    <div className="logro-header-full">
                      <div className="logro-icon-large">🏆</div>
                      <div className="logro-info-full">
                        <h3>{logro.titulo}</h3>
                        <p>{logro.descripcion}</p>
                        <div className="logro-meta">
                          <span className="logro-categoria">{logro.categoria}</span>
                          <span className="logro-fecha-full">
                            {new Date(logro.fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="logro-estudiantes-full">
                          <strong>Participantes:</strong> {logro.estudiantes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'convocatorias' && (
          <div className="convocatorias-section">
            <div className="card">
              <h2>Convocatorias de Matrícula</h2>
              {convocatorias.length === 0 ? (
                <p>No hay convocatorias activas en este momento.</p>
              ) : (
                <div className="convocatorias-list">
                  {convocatorias.map((conv) => (
                    <div key={conv.id} className="convocatoria-card">
                      <h3>{conv.titulo}</h3>
                      <p className="convocatoria-descripcion">{conv.descripcion}</p>
                      <div className="convocatoria-dates">
                        <p><strong>Período:</strong> {new Date(conv.fecha_inicio).toLocaleDateString()} - {new Date(conv.fecha_fin).toLocaleDateString()}</p>
                        <p><strong>Año Académico:</strong> {conv.año_academico}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalPadres;
