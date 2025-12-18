import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import '../styles/OwnerDashboard.css';

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>Panel del Propietario - Vitalexa</h1>
        <div className="header-info">
          <span>👑 {localStorage.getItem('username')}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          📋 Todas las Órdenes
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
        >
          📦 Productos
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Usuarios
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => setActiveTab('reports')}
        >
          📈 Reportes
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'products' && <ProductsPanel />}
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'reports' && <ReportsPanel />}
      </div>
    </div>
  );
}

// ============================================
// PANEL RESUMEN
// ============================================
function OverviewPanel() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ventasMes: 0,
    totalClientes: 0,
    productosActivos: 0,
    ordenesPendientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Hacer varias peticiones para obtener estadísticas
      const [ordersRes, productsRes, clientsRes] = await Promise.all([
        client.get('/admin/orders'),
        client.get('/admin/products'),
        client.get('/admin/clients')
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const ordersToday = ordersRes.data.filter(order => 
        new Date(order.fecha) >= today
      );

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const ordersMonth = ordersRes.data.filter(order => 
        new Date(order.fecha) >= startOfMonth
      );

      const pendingOrders = ordersRes.data.filter(order => 
        order.estado === 'PENDIENTE' || order.estado === 'CONFIRMADO'
      );

      const activeProducts = productsRes.data.filter(p => p.active).length;

      setStats({
        ventasHoy: ordersToday.reduce((sum, o) => sum + parseFloat(o.total), 0),
        ventasMes: ordersMonth.reduce((sum, o) => sum + parseFloat(o.total), 0),
        totalClientes: clientsRes.data.length,
        productosActivos: activeProducts,
        ordenesPendientes: pendingOrders.length
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  return (
    <div className="overview-panel">
      <h2>📊 Resumen General</h2>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Ventas Hoy</h3>
            <p className="stat-value">${stats.ventasHoy.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>Ventas del Mes</h3>
            <p className="stat-value">${stats.ventasMes.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Clientes</h3>
            <p className="stat-value">{stats.totalClientes}</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Productos Activos</h3>
            <p className="stat-value">{stats.productosActivos}</p>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Órdenes Pendientes</h3>
            <p className="stat-value">{stats.ordenesPendientes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PANEL ÓRDENES (Reutiliza el del Admin)
// ============================================
function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await client.get('/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.estado === filter;
  });

  if (loading) {
    return <div className="loading">Cargando órdenes...</div>;
  }

  return (
    <div className="orders-panel">
      <div className="panel-header">
        <h2>📋 Todas las Órdenes</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button 
            className={filter === 'PENDIENTE' ? 'active' : ''}
            onClick={() => setFilter('PENDIENTE')}
          >
            Pendientes
          </button>
          <button 
            className={filter === 'CONFIRMADO' ? 'active' : ''}
            onClick={() => setFilter('CONFIRMADO')}
          >
            Confirmadas
          </button>
          <button 
            className={filter === 'COMPLETADO' ? 'active' : ''}
            onClick={() => setFilter('COMPLETADO')}
          >
            Completadas
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id.substring(0, 8)}</td>
                <td>{new Date(order.fecha).toLocaleDateString()}</td>
                <td>{order.cliente}</td>
                <td>{order.vendedor}</td>
                <td>${parseFloat(order.total).toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${order.estado.toLowerCase()}`}>
                    {order.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PANEL PRODUCTOS
// ============================================
function ProductsPanel() {
  return (
    <div className="products-panel">
      <h2>📦 Gestión de Productos</h2>
      <p style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
        El Owner tiene los mismos permisos que el Admin para gestionar productos.
        <br />
        Esta funcionalidad es idéntica al panel de Admin.
      </p>
    </div>
  );
}

// ============================================
// PANEL USUARIOS
// ============================================
function UsersPanel() {
  return (
    <div className="users-panel">
      <h2>👥 Gestión de Usuarios</h2>
      <p style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
        Funcionalidad de gestión de usuarios pendiente de implementación.
      </p>
    </div>
  );
}

// ============================================
// PANEL REPORTES
// ============================================
function ReportsPanel() {
  return (
    <div className="reports-panel">
      <h2>📈 Reportes y Análisis</h2>
      <p style={{textAlign: 'center', padding: '40px', color: '#6b7280'}}>
        Funcionalidad de reportes pendiente de implementación.
      </p>
    </div>
  );
}

export default OwnerDashboard;
