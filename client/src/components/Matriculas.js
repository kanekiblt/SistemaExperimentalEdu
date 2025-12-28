import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { matriculaService, documentosService } from '../services/api';
import './Matriculas.css';

const Matriculas = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatricula, setSelectedMatricula] = useState(null);

  useEffect(() => {
    loadMatriculas();
  }, []);

  const loadMatriculas = async () => {
    try {
      const response = await matriculaService.getAll();
      setMatriculas(response.data);
    } catch (error) {
      toast.error('Error al cargar matrículas');
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (id, nuevoEstado) => {
    try {
      await matriculaService.updateEstado(id, nuevoEstado, nuevoEstado === 'completado');
      toast.success('Estado actualizado');
      loadMatriculas();
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

  const handleRatificacion = async () => {
    const añoAcademico = new Date().getFullYear().toString();
    if (window.confirm('¿Desea enviar las ratificaciones de permanencia a todos los estudiantes activos?')) {
      try {
        const response = await matriculaService.ratificacion(añoAcademico);
        toast.success(`Ratificación enviada a ${response.data.enviados} apoderados`);
      } catch (error) {
        toast.error('Error al enviar ratificaciones');
      }
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h1>Gestión de Matrículas</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/inscripcion" target="_blank" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Nueva Inscripción
          </a>
          <button onClick={handleRatificacion} className="btn btn-success">
            Enviar Ratificación Masiva
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>DNI</th>
              <th>Nivel</th>
              <th>Año</th>
              <th>Estado</th>
              <th>Fecha Inscripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {matriculas.map((mat) => (
              <tr key={mat.id}>
                <td>{mat.nombres} {mat.apellidos}</td>
                <td>{mat.dni}</td>
                <td>{mat.nivel}</td>
                <td>{mat.año_academico}</td>
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
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    Constancia
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Matriculas;

