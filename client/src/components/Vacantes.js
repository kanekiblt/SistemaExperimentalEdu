import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { vacantesService } from '../services/api';

const Vacantes = () => {
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    año_academico: new Date().getFullYear().toString(),
    nivel: '',
    grado: '',
    turno: '',
    total: ''
  });

  useEffect(() => {
    loadVacantes();
  }, []);

  const loadVacantes = async () => {
    try {
      const response = await vacantesService.getAll(formData.año_academico);
      setVacantes(response.data);
    } catch (error) {
      toast.error('Error al cargar vacantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vacantesService.create(formData);
      toast.success('Vacantes configuradas');
      loadVacantes();
      setFormData({
        año_academico: new Date().getFullYear().toString(),
        nivel: '',
        grado: '',
        turno: '',
        total: ''
      });
    } catch (error) {
      toast.error('Error al crear vacantes');
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <h1>Gestión de Vacantes</h1>

      <div className="card">
        <h2>Configurar Nuevas Vacantes</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
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
              <label>Nivel</label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                required
              >
                <option value="">Seleccione</option>
                <option>Inicial</option>
                <option>Primaria</option>
                <option>Secundaria</option>
              </select>
            </div>
            <div className="form-group">
              <label>Grado</label>
              <input
                type="text"
                value={formData.grado}
                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Turno</label>
              <select
                value={formData.turno}
                onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                required
              >
                <option value="">Seleccione</option>
                <option>Mañana</option>
                <option>Tarde</option>
              </select>
            </div>
            <div className="form-group">
              <label>Total de Vacantes</label>
              <input
                type="number"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Crear Vacantes</button>
        </form>
      </div>

      <div className="card">
        <h2>Vacantes Disponibles</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Año</th>
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
                <td>{vac.año_academico}</td>
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

export default Vacantes;

