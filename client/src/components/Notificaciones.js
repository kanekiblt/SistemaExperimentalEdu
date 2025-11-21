import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { notificacionesService } from '../services/api';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    destinatario: '',
    tipo: 'general',
    canal: 'email',
    mensaje: ''
  });

  useEffect(() => {
    loadNotificaciones();
  }, []);

  const loadNotificaciones = async () => {
    try {
      const response = await notificacionesService.getAll();
      setNotificaciones(response.data);
    } catch (error) {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await notificacionesService.enviar(formData);
      toast.success('Notificación enviada');
      loadNotificaciones();
      setFormData({
        destinatario: '',
        tipo: 'general',
        canal: 'email',
        mensaje: ''
      });
    } catch (error) {
      toast.error('Error al enviar notificación');
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <h1>Gestión de Notificaciones</h1>

      <div className="card">
        <h2>Enviar Notificación Manual</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Destinatario (Email o Teléfono)</label>
            <input
              type="text"
              value={formData.destinatario}
              onChange={(e) => setFormData({ ...formData, destinatario: e.target.value })}
              required
            />
          </div>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="general">General</option>
                <option value="ratificacion">Ratificación</option>
                <option value="confirmacion">Confirmación</option>
              </select>
            </div>
            <div className="form-group">
              <label>Canal</label>
              <select
                value={formData.canal}
                onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Mensaje</label>
            <textarea
              rows="5"
              value={formData.mensaje}
              onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Enviar</button>
        </form>
      </div>

      <div className="card">
        <h2>Historial de Notificaciones</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Destinatario</th>
              <th>Tipo</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {notificaciones.map((not) => (
              <tr key={not.id}>
                <td>{not.destinatario}</td>
                <td>{not.tipo}</td>
                <td>{not.canal}</td>
                <td>
                  <span className={`badge badge-${not.estado === 'enviado' ? 'success' : 'danger'}`}>
                    {not.estado}
                  </span>
                </td>
                <td>{new Date(not.fecha_envio || not.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notificaciones;

