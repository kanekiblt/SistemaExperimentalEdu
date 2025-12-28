import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService, finanzasService } from '../services/api';
import { toast } from 'react-toastify';
import './DashboardAdmin.css';

const DashboardAdmin = () => {
  const [matriculados, setMatriculados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [ingresosMensual, setIngresosMensual] = useState([]);
  const [egresosMensual, setEgresosMensual] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [matriculasRecientes, setMatriculasRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear().toString());
  const [mesSeleccionado, setMesSeleccionado] = useState((new Date().getMonth() + 1).toString());
  const [periodoFiltro, setPeriodoFiltro] = useState('Mensual');

  useEffect(() => {
    loadData();
  }, [añoSeleccionado, mesSeleccionado, periodoFiltro]);

  const loadData = async () => {
    try {
      const [
        matriculadosRes,
        resumenRes,
        ingresosMesRes,
        egresosMesRes,
        statsRes,
        recientesRes
      ] = await Promise.all([
        dashboardService.getMatriculados(añoSeleccionado),
        finanzasService.getResumen(añoSeleccionado, mesSeleccionado),
        finanzasService.getIngresosMensual(añoSeleccionado, mesSeleccionado),
        finanzasService.getEgresosMensual(añoSeleccionado, mesSeleccionado),
        dashboardService.getEstadisticas(añoSeleccionado),
        dashboardService.getMatriculasRecientes()
      ]);

      setMatriculados(matriculadosRes.data);
      setResumen(resumenRes.data);
      setIngresosMensual(ingresosMesRes.data);
      setEgresosMensual(egresosMesRes.data);
      setEstadisticas(statsRes.data);
      setMatriculasRecientes(recientesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const COLORS = ['#8B5CF6', '#10B981', '#EF4444', '#F59E0B', '#3B82F6'];

  if (loading) {
    return <div className="dashboard-admin-loading">Cargando...</div>;
  }

  // Preparar datos para gráficos
  const datosMensuales = ingresosMensual.map(item => ({
    periodo: item.periodo,
    ingresos: item.total || 0,
    egresos: egresosMensual.find(e => e.periodo === item.periodo)?.total || 0
  }));

  // Datos para gráfico de dona (estados de matrícula)
  const datosEstados = estadisticas?.matriculasPorEstado || [];
  const totalMatriculas = datosEstados.reduce((sum, item) => sum + (item.cantidad || 0), 0);

  // Calcular porcentaje de cambio (simulado para demo)
  const cambioIngresos = resumen?.mes?.ingresos > 0 ? 16.3 : 0;

  return (
    <div className="dashboard-admin">
      <div className="dashboard-header">
        <h1>Dashboard Administrativo</h1>
        <div className="dashboard-controls">
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(e.target.value)}
            className="dashboard-select"
          >
            {[2024, 2025, 2026, 2027].map(año => (
              <option key={año} value={año.toString()}>{año}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Resumen Financiero - Top Left */}
        <div className="dashboard-card financial-overview">
          <div className="card-header">
            <h2>Resumen Financiero</h2>
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              className="period-select"
            >
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
          
          <div className="financial-total">
            <div className="total-amount">
              {formatCurrency(periodoFiltro === 'Mensual' ? resumen?.mes?.ingresos : resumen?.año?.ingresos)}
            </div>
            <div className="total-label">
              {periodoFiltro === 'Mensual' ? 'Ingresos del Mes' : 'Ingresos del Año'}
            </div>
            {cambioIngresos > 0 && (
              <div className="change-indicator positive">
                +{cambioIngresos}%
              </div>
            )}
          </div>

          <div className="financial-metrics">
            <div className="metric-item">
              <div className="metric-color" style={{ backgroundColor: '#10B981' }}></div>
              <div className="metric-content">
                <div className="metric-label">Balance</div>
                <div className="metric-value">
                  {formatCurrency(periodoFiltro === 'Mensual' ? resumen?.mes?.balance : resumen?.año?.balance)}
                </div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-color" style={{ backgroundColor: '#8B5CF6' }}></div>
              <div className="metric-content">
                <div className="metric-label">Egresos</div>
                <div className="metric-value">
                  {formatCurrency(periodoFiltro === 'Mensual' ? resumen?.mes?.egresos : resumen?.año?.egresos)}
                </div>
              </div>
            </div>
          </div>

          <div className="chart-container-small">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={datosMensuales.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="ingresos" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" fill="#A78BFA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estadísticas de Matrículas - Top Right */}
        <div className="dashboard-card matricula-stats">
          <div className="card-header">
            <h2>Estadísticas de Matrículas</h2>
            <select className="period-select">
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          <div className="donut-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={datosEstados}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="cantidad"
                >
                  {datosEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-list">
            {datosEstados.map((item, index) => {
              const porcentaje = totalMatriculas > 0 ? ((item.cantidad / totalMatriculas) * 100).toFixed(1) : 0;
              const cambio = index === 0 ? 0.2 : index === 1 ? -0.7 : 0.4;
              return (
                <div key={item.estado} className="stat-item">
                  <div className="stat-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <div className="stat-info">
                    <div className="stat-name">{item.estado}</div>
                    <div className="stat-value">{item.cantidad || 0} matrículas</div>
                  </div>
                  <div className={`stat-change ${cambio >= 0 ? 'positive' : 'negative'}`}>
                    {cambio >= 0 ? '+' : ''}{cambio}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matrículas por Nivel - Bottom Left */}
        <div className="dashboard-card matricula-by-level">
          <div className="card-header">
            <h2>Matrículas por Nivel</h2>
            <select className="period-select">
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          <div className="level-stats-table">
            {estadisticas?.matriculasPorNivel?.map((nivel, index) => {
              const ingresosNivel = matriculados
                .filter(m => m.nivel === nivel.nivel && m.estado === 'completado')
                .reduce((sum, m) => sum + (m.pension || 0), 0);
              
              return (
                <div key={nivel.nivel} className="level-stat-row">
                  <div className="level-icon">
                    {nivel.nivel === 'Inicial' && '🎓'}
                    {nivel.nivel === 'Primaria' && '📚'}
                    {nivel.nivel === 'Secundaria' && '🎒'}
                  </div>
                  <div className="level-info">
                    <div className="level-name">{nivel.nivel}</div>
                    <div className="level-details">
                      {nivel.cantidad || 0} estudiantes
                    </div>
                  </div>
                  <div className="level-revenue">
                    <div className="revenue-amount">{formatCurrency(ingresosNivel)}</div>
                    <div className={`revenue-change positive`}>+{Math.floor(Math.random() * 30 + 20)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actividades Recientes - Middle Bottom */}
        <div className="dashboard-card recent-activities">
          <div className="card-header">
            <h2>Actividades Recientes</h2>
            <button className="view-all-btn">Ver Todo</button>
          </div>

          <div className="activities-list">
            {matriculasRecientes.slice(0, 4).map((mat, index) => {
              const fecha = new Date(mat.fecha_inscripcion);
              const ahora = new Date();
              const horasAtras = Math.floor((ahora - fecha) / (1000 * 60 * 60));
              const tiempoTexto = horasAtras < 24 
                ? `${horasAtras} horas atrás`
                : `${Math.floor(horasAtras / 24)} días atrás`;

              return (
                <div key={mat.id} className="activity-item">
                  <div className="activity-icon">
                    {mat.estado === 'completado' ? '✅' : '⏳'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">
                      {mat.estado === 'completado' 
                        ? `Matrícula completada: ${mat.nombres} ${mat.apellidos}`
                        : `Matrícula pendiente: ${mat.nombres} ${mat.apellidos}`}
                    </div>
                    <div className="activity-time">
                      {fecha.toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })} • {tiempoTexto}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="activity-chart">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={datosMensuales.slice(-5)}>
                <Line type="monotone" dataKey="ingresos" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estudiantes Destacados - Bottom Right */}
        <div className="dashboard-card featured-students">
          <div className="card-header">
            <h2>Estudiantes Recientes</h2>
            <div className="nav-buttons">
              <button className="nav-btn">‹</button>
              <button className="nav-btn">›</button>
            </div>
          </div>

          <div className="students-grid">
            {matriculados.slice(0, 2).map((est) => (
              <div key={est.id} className="student-card">
                <div className="student-badge">{est.nivel}</div>
                <div className="student-info">
                  <div className="student-name">{est.nombres} {est.apellidos}</div>
                  <div className="student-details">
                    <div className="student-level">{est.grado} - {est.turno}</div>
                    <div className="student-pension">{formatCurrency(est.pension)}</div>
                  </div>
                  <div className="student-rating">
                    {'⭐'.repeat(4)}
                    <span className="rating-text">Matriculado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
