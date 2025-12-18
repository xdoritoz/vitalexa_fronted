import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import VendedorDashboard from './pages/VendedorDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

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
    </BrowserRouter>
  );
}

export default App;
