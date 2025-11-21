import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { estudiantesService } from '../services/api';

const Estudiantes = () => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    try {
      const response = await estudiantesService.getAll();
      setEstudiantes(response.data);
    } catch (error) {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <h1>Estudiantes</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Nivel</th>
              <th>Grado</th>
              <th>Turno</th>
              <th>Estado</th>
              <th>Contacto</th>
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
                <td>
                  <span className={`badge badge-${est.estado === 'activo' ? 'success' : 'danger'}`}>
                    {est.estado}
                  </span>
                </td>
                <td>
                  {est.apoderado_nombres && (
                    <div>
                      <div>{est.apoderado_nombres}</div>
                      <small>{est.telefono}</small>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Estudiantes;

