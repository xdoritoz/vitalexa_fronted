import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VendedorDashboard from './pages/VendedorDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import NotificationCenter from './components/NotificationCenter';
import './App.css';

function App() {
  const getRole = () => localStorage.getItem('role');
  const getToken = () => localStorage.getItem('token');

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const role = getRole();
    const token = getToken();

    if (!token) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  return (
    <BrowserRouter>
      <AppContent 
        getRole={getRole} 
        getToken={getToken} 
        ProtectedRoute={ProtectedRoute} 
      />
    </BrowserRouter>
  );
}

function AppContent({ getRole, getToken, ProtectedRoute }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const token = getToken();
  const role = getRole();

  // Convertir rol a formato simple para NotificationCenter
  const getUserRole = () => {
    if (!role) return null;
    if (role === 'ROLE_ADMIN') return 'admin';
    if (role === 'ROLE_OWNER') return 'owner';
    if (role === 'ROLE_VENDEDOR') return 'vendedor';
    return 'vendedor';
  };

  return (
    <div className="app">
      {/* Header con notificaciones - Solo mostrar si NO es login y usuario está autenticado */}
      {!isLoginPage && token && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="app-title">🏪 Vitalexa</h1>
              <span className="app-subtitle">Sistema de Gestión</span>
            </div>
            
            <div className="header-right">
              <div className="user-info">
                <span className="user-role">
                  {role === 'ROLE_ADMIN' && '👨‍💼 Admin'}
                  {role === 'ROLE_OWNER' && '👑 Owner'}
                  {role === 'ROLE_VENDEDOR' && '🛒 Vendedor'}
                </span>
              </div>
              
              {/* Sistema de Notificaciones */}
              <NotificationCenter userRole={getUserRole()} />
              
              <button 
                className="btn-logout"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Contenido principal */}
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_OWNER']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vendedor/*"
            element={
              <ProtectedRoute allowedRoles={['ROLE_VENDEDOR']}>
                <VendedorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowedRoles={['ROLE_OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
