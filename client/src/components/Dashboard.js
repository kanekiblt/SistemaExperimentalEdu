import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [matriculasRecientes, setMatriculasRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const añoActual = new Date().getFullYear().toString();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, recientesRes] = await Promise.all([
        dashboardService.getEstadisticas(añoActual),
        dashboardService.getMatriculasRecientes()
      ]);
      setEstadisticas(statsRes.data);
      setMatriculasRecientes(recientesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <h1>Dashboard - Año Académico {añoActual}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Estudiantes</h3>
          <p className="stat-number">{estadisticas?.totalEstudiantes || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Matrículas Recientes</h3>
          <p className="stat-number">{estadisticas?.matriculasRecientes || 0}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2>Matrículas por Estado</h2>
          {estadisticas?.matriculasPorEstado && (
            <BarChart width={500} height={300} data={estadisticas.matriculasPorEstado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="estado" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#0066cc" />
            </BarChart>
          )}
        </div>

        <div className="card">
          <h2>Matrículas por Nivel</h2>
          {estadisticas?.matriculasPorNivel && (
            <PieChart width={400} height={300}>
              <Pie
                data={estadisticas.matriculasPorNivel}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ nivel, cantidad }) => `${nivel}: ${cantidad}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
              >
                {estadisticas.matriculasPorNivel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Matrículas Recientes</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>DNI</th>
              <th>Nivel</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {matriculasRecientes.map((mat) => (
              <tr key={mat.id}>
                <td>{mat.nombres} {mat.apellidos}</td>
                <td>{mat.dni}</td>
                <td>{mat.nivel}</td>
                <td>
                  <span className={`badge badge-${mat.estado === 'completado' ? 'success' : 'warning'}`}>
                    {mat.estado}
                  </span>
                </td>
                <td>{new Date(mat.fecha_inscripcion).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;

