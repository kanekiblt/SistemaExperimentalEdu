import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardAdmin from './components/DashboardAdmin';
import PortalDirector from './components/PortalDirector';
import PortalSecretaria from './components/PortalSecretaria';
import PortalPadres from './components/PortalPadres';
import Inscripcion from './components/Inscripcion';
import Matriculas from './components/Matriculas';
import Estudiantes from './components/Estudiantes';
import Vacantes from './components/Vacantes';
import Notificaciones from './components/Notificaciones';
import Navbar from './components/Navbar';
import { authService } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.verify()
        .then(response => {
          setIsAuthenticated(true);
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  }

  // Función para obtener el portal según el rol
  const getPortalByRole = (rol) => {
    switch (rol) {
      case 'director':
        return <PortalDirector />;
      case 'secretaria':
        return <PortalSecretaria />;
      case 'admin':
        return <DashboardAdmin />;
      default:
        return <DashboardAdmin />;
    }
  };

  return (
    <Router>
      <div className="App">
        {/* Portal público de padres - sin navbar */}
        <Routes>
          <Route
            path="/padres"
            element={<PortalPadres />}
          />
          <Route
            path="/inscripcion"
            element={<Inscripcion />}
          />
        </Routes>

        {/* Rutas con autenticación */}
        {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={user?.rol === 'director' ? '/director' : user?.rol === 'secretaria' ? '/secretaria' : '/dashboard'} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/director"
            element={
              isAuthenticated && (user?.rol === 'director' || user?.rol === 'admin') ? (
                <PortalDirector />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/secretaria"
            element={
              isAuthenticated && (user?.rol === 'secretaria' || user?.rol === 'admin') ? (
                <PortalSecretaria />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                user?.rol === 'admin' ? <DashboardAdmin /> : getPortalByRole(user?.rol)
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/matriculas"
            element={
              isAuthenticated ? (
                <Matriculas />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/estudiantes"
            element={
              isAuthenticated ? (
                <Estudiantes />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/vacantes"
            element={
              isAuthenticated ? (
                <Vacantes />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/notificaciones"
            element={
              isAuthenticated ? (
                <Notificaciones />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? (user?.rol === 'director' ? '/director' : user?.rol === 'secretaria' ? '/secretaria' : '/dashboard') : '/padres'} />
            }
          />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
}

export default App;

