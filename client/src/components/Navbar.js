import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard">Sistema de Matrícula UNS</Link>
        </div>
        <div className="navbar-menu">
          {user?.rol === 'director' && (
            <Link to="/director" className={isActive('/director') ? 'active' : ''}>
              Portal Director
            </Link>
          )}
          {user?.rol === 'secretaria' && (
            <Link to="/secretaria" className={isActive('/secretaria') ? 'active' : ''}>
              Portal Secretaría
            </Link>
          )}
          {(user?.rol === 'admin' || user?.rol === 'secretaria') && (
            <>
              <Link to="/matriculas" className={isActive('/matriculas') ? 'active' : ''}>
                Matrículas
              </Link>
              <Link to="/estudiantes" className={isActive('/estudiantes') ? 'active' : ''}>
                Estudiantes
              </Link>
              <Link to="/vacantes" className={isActive('/vacantes') ? 'active' : ''}>
                Vacantes
              </Link>
            </>
          )}
          {user?.rol === 'admin' && (
            <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
              Dashboard
            </Link>
          )}
          <Link to="/notificaciones" className={isActive('/notificaciones') ? 'active' : ''}>
            Notificaciones
          </Link>
        </div>
        <div className="navbar-user">
          <span>{user?.nombre || user?.email}</span>
          <button onClick={onLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

