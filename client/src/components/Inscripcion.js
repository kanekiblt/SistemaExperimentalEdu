import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { matriculaService, vacantesService } from '../services/api';
import './Inscripcion.css';

const Inscripcion = () => {
  const [vacantes, setVacantes] = useState([]);
  const [formData, setFormData] = useState({
    estudiante: {
      dni: '',
      nombres: '',
      apellidos: '',
      fecha_nacimiento: ''
    },
    apoderado: {
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      email: '',
      parentesco: 'Padre'
    },
    año_academico: new Date().getFullYear().toString(),
    nivel: '',
    grado: '',
    turno: '',
    numero_voucher: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVacantes();
  }, []);

  const loadVacantes = async () => {
    try {
      const response = await vacantesService.getAll(formData.año_academico);
      setVacantes(response.data);
    } catch (error) {
      console.error('Error al cargar vacantes:', error);
    }
  };

  useEffect(() => {
    loadVacantes();
  }, [formData.año_academico]);

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await matriculaService.inscripcion(formData);
      toast.success('Inscripción realizada exitosamente. Recibirá una confirmación por correo.');
      // Reset form
      setFormData({
        estudiante: {
          dni: '',
          nombres: '',
          apellidos: '',
          fecha_nacimiento: ''
        },
        apoderado: {
          nombres: '',
          apellidos: '',
          dni: '',
          telefono: '',
          email: '',
          parentesco: 'Padre'
        },
        año_academico: new Date().getFullYear().toString(),
        nivel: '',
        grado: '',
        turno: '',
        numero_voucher: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al realizar la inscripción');
    } finally {
      setLoading(false);
    }
  };

  const vacantesDisponibles = vacantes.filter(v =>
    v.nivel === formData.nivel &&
    v.grado === formData.grado &&
    v.turno === formData.turno &&
    v.disponibles > 0
  );

  // Si está dentro del portal de padres, no mostrar el header duplicado
  const isInPortal = window.location.pathname === '/padres';

  return (
    <div className={isInPortal ? "inscripcion-container-inline" : "inscripcion-container"}>
      {!isInPortal && (
        <div className="inscripcion-header">
          <h1>Colegio Experimental UNS</h1>
          <h2>Inscripción de Matrícula</h2>
        </div>
      )}

      <div className="inscripcion-card">
        <form onSubmit={handleSubmit}>
          <h3>Datos del Estudiante</h3>
          <div className="form-row">
            <div className="form-group">
              <label>DNI *</label>
              <input
                type="text"
                value={formData.estudiante.dni}
                onChange={(e) => handleChange('estudiante', 'dni', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha de Nacimiento *</label>
              <input
                type="date"
                value={formData.estudiante.fecha_nacimiento}
                onChange={(e) => handleChange('estudiante', 'fecha_nacimiento', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nombres *</label>
              <input
                type="text"
                value={formData.estudiante.nombres}
                onChange={(e) => handleChange('estudiante', 'nombres', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                value={formData.estudiante.apellidos}
                onChange={(e) => handleChange('estudiante', 'apellidos', e.target.value)}
                required
              />
            </div>
          </div>

          <h3>Datos del Apoderado</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombres *</label>
              <input
                type="text"
                value={formData.apoderado.nombres}
                onChange={(e) => handleChange('apoderado', 'nombres', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Apellidos *</label>
              <input
                type="text"
                value={formData.apoderado.apellidos}
                onChange={(e) => handleChange('apoderado', 'apellidos', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>DNI *</label>
              <input
                type="text"
                value={formData.apoderado.dni}
                onChange={(e) => handleChange('apoderado', 'dni', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="tel"
                value={formData.apoderado.telefono}
                onChange={(e) => handleChange('apoderado', 'telefono', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.apoderado.email}
                onChange={(e) => handleChange('apoderado', 'email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Parentesco</label>
              <select
                value={formData.apoderado.parentesco}
                onChange={(e) => handleChange('apoderado', 'parentesco', e.target.value)}
              >
                <option>Padre</option>
                <option>Madre</option>
                <option>Tutor</option>
                <option>Otro</option>
              </select>
            </div>
          </div>

          <h3>Datos de Matrícula</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Año Académico *</label>
              <input
                type="text"
                value={formData.año_academico}
                onChange={(e) => handleChange(null, 'año_academico', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Nivel *</label>
              <select
                value={formData.nivel}
                onChange={(e) => handleChange(null, 'nivel', e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                <option>Inicial</option>
                <option>Primaria</option>
                <option>Secundaria</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Grado *</label>
              <select
                value={formData.grado}
                onChange={(e) => handleChange(null, 'grado', e.target.value)}
                required
                disabled={!formData.nivel}
              >
                <option value="">Seleccione</option>
                {[...new Set(vacantes
                  .filter(v => v.nivel === formData.nivel && v.disponibles > 0)
                  .map(v => v.grado)
                  .sort()
                )].map(grado => (
                  <option key={grado} value={grado}>{grado}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Turno *</label>
              <select
                value={formData.turno}
                onChange={(e) => handleChange(null, 'turno', e.target.value)}
                required
                disabled={!formData.grado}
              >
                <option value="">Seleccione</option>
                {[...new Set(vacantes
                  .filter(v => v.nivel === formData.nivel && v.grado === formData.grado && v.disponibles > 0)
                  .map(v => v.turno)
                )].map(turno => (
                  <option key={turno} value={turno}>{turno}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Número de Voucher (Banco de la Nación) *</label>
            <input
              type="text"
              value={formData.numero_voucher}
              onChange={(e) => handleChange(null, 'numero_voucher', e.target.value)}
              required
              placeholder="Número de comprobante de pago"
            />
          </div>

          {vacantesDisponibles.length === 0 && formData.nivel && formData.grado && formData.turno && (
            <div className="alert alert-warning">
              No hay vacantes disponibles para esta combinación. Por favor, seleccione otra opción.
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading || vacantesDisponibles.length === 0}>
            {loading ? 'Procesando...' : 'Enviar Inscripción'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Inscripcion;

