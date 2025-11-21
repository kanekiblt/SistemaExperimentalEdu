import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { matriculaService, convocatoriasService, documentosService, vacantesService } from '../services/api';
import './PortalSecretaria.css';

const PortalSecretaria = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [convocatorias, setConvocatorias] = useState([]);
  const [vacantes, setVacantes] = useState([]);
  const [showConvocatoriaForm, setShowConvocatoriaForm] = useState(false);
  const [convocatoriaData, setConvocatoriaData] = useState({
    año_academico: new Date().getFullYear().toString(),
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matRes, convRes, vacRes] = await Promise.all([
        matriculaService.getAll(),
        convocatoriasService.getAll(),
        vacantesService.getAll(new Date().getFullYear().toString())
      ]);
      setMatriculas(matRes.data);
      setConvocatorias(convRes.data);
      setVacantes(vacRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const handleCrearConvocatoria = async (e) => {
    e.preventDefault();
    try {
      await convocatoriasService.create(convocatoriaData);
      toast.success('Convocatoria creada y publicada');
      setShowConvocatoriaForm(false);
      setConvocatoriaData({
        año_academico: new Date().getFullYear().toString(),
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: ''
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear convocatoria');
    }
  };

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      await matriculaService.updateEstado(id, nuevoEstado, nuevoEstado === 'completado');
      toast.success('Estado actualizado');
      loadData();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleGenerarConstancia = async (matriculaId) => {
    try {
      const response = await documentosService.getConstancia(matriculaId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `constancia_matricula_${matriculaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Constancia generada exitosamente');
    } catch (error) {
      toast.error('Error al generar constancia');
    }
  };

  return (
    <div className="container portal-secretaria">
      <div className="portal-header">
        <h1>Portal de Secretaría</h1>
        <p>Gestión de Convocatorias y Matrículas</p>
      </div>

      <div className="actions-section">
        <button 
          onClick={() => setShowConvocatoriaForm(!showConvocatoriaForm)} 
          className="btn btn-primary btn-large"
        >
          {showConvocatoriaForm ? 'Cancelar' : 'Nueva Convocatoria'}
        </button>
      </div>

      {showConvocatoriaForm && (
        <div className="card">
          <h2>Crear Convocatoria de Matrícula</h2>
          <form onSubmit={handleCrearConvocatoria}>
            <div className="form-group">
              <label>Título *</label>
              <input
                type="text"
                value={convocatoriaData.titulo}
                onChange={(e) => setConvocatoriaData({ ...convocatoriaData, titulo: e.target.value })}
                required
                placeholder="Ej: Convocatoria de Matrícula 2024"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Año Académico</label>
                <input
                  type="text"
                  value={convocatoriaData.año_academico}
                  onChange={(e) => setConvocatoriaData({ ...convocatoriaData, año_academico: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <input
                  type="date"
                  value={convocatoriaData.fecha_inicio}
                  onChange={(e) => setConvocatoriaData({ ...convocatoriaData, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha de Fin</label>
                <input
                  type="date"
                  value={convocatoriaData.fecha_fin}
                  onChange={(e) => setConvocatoriaData({ ...convocatoriaData, fecha_fin: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                rows="4"
                value={convocatoriaData.descripcion}
                onChange={(e) => setConvocatoriaData({ ...convocatoriaData, descripcion: e.target.value })}
                placeholder="Información sobre el proceso de matrícula..."
              />
            </div>
            <button type="submit" className="btn btn-primary">Publicar Convocatoria</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Convocatorias Activas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Año Académico</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {convocatorias.filter(c => c.estado === 'activa').map((conv) => (
              <tr key={conv.id}>
                <td>{conv.titulo}</td>
                <td>{conv.año_academico}</td>
                <td>{conv.fecha_inicio ? new Date(conv.fecha_inicio).toLocaleDateString() : '-'}</td>
                <td>{conv.fecha_fin ? new Date(conv.fecha_fin).toLocaleDateString() : '-'}</td>
                <td>
                  <span className="badge badge-success">Activa</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Gestión de Matrículas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>DNI</th>
              <th>Nivel</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {matriculas.map((mat) => (
              <tr key={mat.id}>
                <td>{mat.nombres} {mat.apellidos}</td>
                <td>{mat.dni}</td>
                <td>{mat.nivel}</td>
                <td>
                  <select
                    value={mat.estado}
                    onChange={(e) => handleEstadoChange(mat.id, e.target.value)}
                    className={`badge badge-${mat.estado === 'completado' ? 'success' : mat.estado === 'pendiente' ? 'warning' : 'danger'}`}
                    style={{ border: 'none', padding: '5px 10px', borderRadius: '20px', color: 'white', fontWeight: '600' }}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="completado">Completado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </td>
                <td>{new Date(mat.fecha_inscripcion).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleGenerarConstancia(mat.id)}
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '5px 10px', marginRight: '5px' }}
                  >
                    Constancia
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Vacantes Disponibles</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Grado</th>
              <th>Turno</th>
              <th>Total</th>
              <th>Ocupadas</th>
              <th>Disponibles</th>
            </tr>
          </thead>
          <tbody>
            {vacantes.map((vac) => (
              <tr key={vac.id}>
                <td>{vac.nivel}</td>
                <td>{vac.grado}</td>
                <td>{vac.turno}</td>
                <td>{vac.total}</td>
                <td>{vac.ocupadas}</td>
                <td>
                  <span className={`badge ${vac.disponibles > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {vac.disponibles}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortalSecretaria;

