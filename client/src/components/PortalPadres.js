import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { padresService, convocatoriasService } from '../services/api';
import Inscripcion from './Inscripcion';
import './PortalPadres.css';

const PortalPadres = () => {
  const [activeTab, setActiveTab] = useState('inscripcion');
  const [convocatorias, setConvocatorias] = useState([]);
  const [consultaData, setConsultaData] = useState({
    estudiante_dni: '',
    apoderado_dni: ''
  });
  const [matriculas, setMatriculas] = useState([]);
  const [showConsulta, setShowConsulta] = useState(false);

  useEffect(() => {
    loadConvocatorias();
  }, []);

  const loadConvocatorias = async () => {
    try {
      const response = await convocatoriasService.getAll();
      setConvocatorias(response.data.filter(c => c.estado === 'activa' && c.publicada));
    } catch (error) {
      console.error('Error al cargar convocatorias:', error);
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

  return (
    <div className="portal-padres">
      <div className="portal-padres-header">
        <h1>Colegio Experimental UNS</h1>
        <h2>Portal de Padres de Familia</h2>
        <p>Bienvenido al sistema de matrícula en línea</p>
      </div>

      <div className="portal-padres-nav">
        <button
          className={activeTab === 'inscripcion' ? 'active' : ''}
          onClick={() => setActiveTab('inscripcion')}
        >
          Inscripción
        </button>
        <button
          className={activeTab === 'consulta' ? 'active' : ''}
          onClick={() => setActiveTab('consulta')}
        >
          Consultar Estado
        </button>
        <button
          className={activeTab === 'convocatorias' ? 'active' : ''}
          onClick={() => setActiveTab('convocatorias')}
        >
          Convocatorias
        </button>
      </div>

      <div className="portal-padres-content">
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

