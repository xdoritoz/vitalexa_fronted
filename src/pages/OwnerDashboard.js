import React, { useState, useEffect } from 'react';
import client from '../api/client';
import '../styles/OwnerDashboard.css';

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes] = await Promise.all([
        client.get('/owner/orders'),
        client.get('/owner/products')
      ]);
      
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      calculateStats(ordersRes.data, productsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData, productsData) => {
    const completedOrders = ordersData.filter(o => o.estado === 'COMPLETADO');
    const pendingOrders = ordersData.filter(o => o.estado === 'PENDIENTE' || o.estado === 'CONFIRMADO');
    
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const activeProducts = productsData.filter(p => p.active).length;
    const lowStockProducts = productsData.filter(p => p.stock < 10 && p.active).length;

    setStats({
      totalOrders: ordersData.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue: totalRevenue,
      activeProducts: activeProducts,
      totalProducts: productsData.length,
      lowStockProducts: lowStockProducts
    });
  };

  if (loading) {
    return (
      <div className="owner-dashboard">
        <div className="loading">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <header className="dashboard-header">
        <h1>👑 Panel de Owner</h1>
        <p>Vista completa del negocio</p>
      </header>

      <nav className="dashboard-tabs">
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
          📦 Órdenes ({stats?.totalOrders || 0})
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
        >
          🛍️ Productos ({stats?.totalProducts || 0})
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => setActiveTab('reports')}
        >
          📈 Reportes
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders} 
            onSelectOrder={setSelectedOrder}
          />
        )}
        {activeTab === 'products' && <ProductsTab products={products} />}
        {activeTab === 'reports' && <ReportsTab orders={orders} products={products} />}
      </div>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

// ===== OVERVIEW TAB =====
function OverviewTab({ stats }) {
  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Ingresos Totales</h3>
            <p className="stat-value">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Órdenes Completadas</h3>
            <p className="stat-value">{stats?.completedOrders || 0}</p>
            <span className="stat-subtitle">de {stats?.totalOrders || 0} totales</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Órdenes Pendientes</h3>
            <p className="stat-value">{stats?.pendingOrders || 0}</p>
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <h3>Productos Activos</h3>
            <p className="stat-value">{stats?.activeProducts || 0}</p>
            <span className="stat-subtitle">de {stats?.totalProducts || 0} totales</span>
          </div>
        </div>

        {stats?.lowStockProducts > 0 && (
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>Stock Bajo</h3>
              <p className="stat-value">{stats.lowStockProducts}</p>
              <span className="stat-subtitle">productos necesitan reposición</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ORDERS TAB =====
// En tu OwnerDashboard.js

function OrdersTab({ orders }) {
  const [filter, setFilter] = useState('pending');

  // ✅ FILTRO CORREGIDO
  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') {
      // Incluir tanto PENDIENTE como CONFIRMADO
      return order.estado === 'PENDIENTE' || order.estado === 'CONFIRMADO';
    }
    if (filter === 'completed') {
      return order.estado === 'COMPLETADO';
    }
    if (filter === 'all') {
      return true;
    }
    return order.estado === filter;
  });

  return (
    <div className="orders-section">
      <div className="orders-header">
        <h2>📦 Gestión de Órdenes</h2>
        <div className="filter-tabs">
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pendientes ({orders.filter(o => o.estado === 'PENDIENTE' || o.estado === 'CONFIRMADO').length})
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            ✅ Completadas ({orders.filter(o => o.estado === 'COMPLETADO').length})
          </button>
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            📊 Todas ({orders.length})
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>📭 No hay órdenes en esta categoría</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">#{order.id.substring(0, 8)}</span>
                <span className={`order-status status-${order.estado.toLowerCase()}`}>
                  {order.estado}
                </span>
              </div>

              <div className="order-info">
                <p><strong>Vendedor:</strong> {order.vendedor}</p>
                <p><strong>Cliente:</strong> {order.cliente}</p>
                <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString('es-ES')}</p>
                <p className="order-total">
                  <strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}
                </p>
                
                {order.notas && (
                  <div className="order-notes">
                    <strong>📝 Notas:</strong>
                    <p>{order.notas}</p>
                  </div>
                )}
              </div>

              <details className="order-details">
                <summary>Ver productos ({order.items.length})</summary>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-name">{item.productName}</span>
                      <span className="item-qty">
                        {item.cantidad} x ${parseFloat(item.precioUnitario).toFixed(2)}
                      </span>
                      <span className="item-subtotal">
                        ${parseFloat(item.subtotal).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// ===== PRODUCTS TAB =====
function ProductsTab({ products }) {
  const [filter, setFilter] = useState('all');

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true;
    if (filter === 'active') return product.active;
    if (filter === 'inactive') return !product.active;
    if (filter === 'lowstock') return product.stock < 10 && product.active;
    return true;
  });

  return (
    <div className="products-tab">
      <div className="tab-header">
        <h2>Inventario de Productos</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            Todos ({products.length})
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''} 
            onClick={() => setFilter('active')}
          >
            Activos ({products.filter(p => p.active).length})
          </button>
          <button 
            className={filter === 'lowstock' ? 'active' : ''} 
            onClick={() => setFilter('lowstock')}
          >
            Stock Bajo ({products.filter(p => p.stock < 10 && p.active).length})
          </button>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.nombre} />
              ) : (
                <div className="no-image">📦</div>
              )}
            </div>
            
            <div className="product-info">
              <h3>{product.nombre}</h3>
              <p className="product-description">{product.descripcion}</p>
              
              <div className="product-stats">
                <div className="stat">
                  <span className="label">Precio:</span>
                  <span className="value">${parseFloat(product.precio).toFixed(2)}</span>
                </div>
                <div className="stat">
                  <span className="label">Stock:</span>
                  <span className={`value ${product.stock < 10 ? 'low' : ''}`}>
                    {product.stock} unidades
                  </span>
                </div>
              </div>

              <div className="product-status">
                <span className={`badge ${product.active ? 'active' : 'inactive'}`}>
                  {product.active ? '✓ Activo' : '✗ Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== REPORTS TAB (Placeholder) =====
// ===== REPORTS TAB =====
function ReportsTab({ orders, products }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeReportTab, setActiveReportTab] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await client.get('/owner/reports/complete', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      alert('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({...prev, [field]: value}));
  };

  if (loading) {
    return <div className="loading">Generando reportes...</div>;
  }

  if (!reportData) {
    return <div className="no-data">No hay datos disponibles</div>;
  }

  return (
    <div className="reports-tab">
      <div className="reports-header">
        <h2>📈 Sistema de Reportes</h2>
        <div className="date-range-selector">
          <label>
            Desde:
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </label>
          <label>
            Hasta:
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </label>
          <button onClick={fetchReportData} className="btn-refresh">
            🔄 Actualizar
          </button>
        </div>
      </div>

      <nav className="report-tabs">
        <button
          className={activeReportTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveReportTab('overview')}
        >
          📊 Resumen General
        </button>
        <button
          className={activeReportTab === 'sales' ? 'active' : ''}
          onClick={() => setActiveReportTab('sales')}
        >
          💰 Ventas
        </button>
        <button
          className={activeReportTab === 'products' ? 'active' : ''}
          onClick={() => setActiveReportTab('products')}
        >
          📦 Productos
        </button>
        <button
          className={activeReportTab === 'vendors' ? 'active' : ''}
          onClick={() => setActiveReportTab('vendors')}
        >
          👥 Vendedores
        </button>
        <button
          className={activeReportTab === 'clients' ? 'active' : ''}
          onClick={() => setActiveReportTab('clients')}
        >
          🛍️ Clientes
        </button>
      </nav>

      <div className="report-content">
        {activeReportTab === 'overview' && <OverviewReport data={reportData} />}
        {activeReportTab === 'sales' && <SalesReport data={reportData.salesReport} />}
        {activeReportTab === 'products' && <ProductsReport data={reportData.productReport} />}
        {activeReportTab === 'vendors' && <VendorsReport data={reportData.vendorReport} />}
        {activeReportTab === 'clients' && <ClientsReport data={reportData.clientReport} />}
      </div>
    </div>
  );
}

// ===== OVERVIEW REPORT =====
function OverviewReport({ data }) {
  const { salesReport, productReport, vendorReport, clientReport } = data;

  return (
    <div className="overview-report">
      <div className="report-grid">
        {/* Ventas */}
        <div className="report-card highlight">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Ingresos Totales</h3>
            <p className="big-number">${parseFloat(salesReport.totalRevenue).toFixed(2)}</p>
            <span className="card-subtitle">
              Promedio por orden: ${parseFloat(salesReport.averageOrderValue).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Órdenes */}
        <div className="report-card">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <h3>Órdenes</h3>
            <p className="big-number">{salesReport.totalOrders}</p>
            <div className="card-breakdown">
              <span className="success">✓ {salesReport.completedOrders} completadas</span>
              <span className="pending">⏳ {salesReport.pendingOrders} pendientes</span>
              <span className="canceled">✗ {salesReport.canceledOrders} canceladas</span>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="report-card">
          <div className="card-icon">🛍️</div>
          <div className="card-content">
            <h3>Inventario</h3>
            <p className="big-number">{productReport.activeProducts}</p>
            <div className="card-breakdown">
              <span>Valor total: ${parseFloat(productReport.totalInventoryValue).toFixed(2)}</span>
              {productReport.lowStockProducts > 0 && (
                <span className="warning">⚠️ {productReport.lowStockProducts} con stock bajo</span>
              )}
            </div>
          </div>
        </div>

        {/* Clientes */}
        <div className="report-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Clientes</h3>
            <p className="big-number">{clientReport.totalClients}</p>
            <span className="card-subtitle">
              {clientReport.activeClients} activos
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de ventas diarias */}
      <div className="chart-section">
        <h3>📊 Tendencia de Ventas</h3>
        <SalesChart data={salesReport.dailySales} />
      </div>

      {/* Top Productos */}
      <div className="chart-section">
        <h3>🏆 Top 5 Productos Más Vendidos</h3>
        <TopProductsChart data={productReport.topSellingProducts.slice(0, 5)} />
      </div>
    </div>
  );
}

// ===== SALES REPORT =====
function SalesReport({ data }) {
  return (
    <div className="sales-report">
      <div className="metrics-grid">
        <div className="metric-box">
          <h4>Ingresos Totales</h4>
          <p className="metric-value">${parseFloat(data.totalRevenue).toFixed(2)}</p>
        </div>
        <div className="metric-box">
          <h4>Promedio por Orden</h4>
          <p className="metric-value">${parseFloat(data.averageOrderValue).toFixed(2)}</p>
        </div>
        <div className="metric-box">
          <h4>Total Órdenes</h4>
          <p className="metric-value">{data.totalOrders}</p>
        </div>
        <div className="metric-box">
          <h4>Tasa de Éxito</h4>
          <p className="metric-value">
            {data.totalOrders > 0
              ? ((data.completedOrders / data.totalOrders) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      <div className="status-breakdown">
        <h3>Estado de Órdenes</h3>
        <div className="status-bars">
          <div className="status-bar">
            <div className="status-label">
              <span>Completadas</span>
              <span>{data.completedOrders}</span>
            </div>
            <div className="bar-container">
              <div
                className="bar completed"
                style={{
                  width: `${(data.completedOrders / data.totalOrders) * 100}%`
                }}
              />
            </div>
          </div>
          <div className="status-bar">
            <div className="status-label">
              <span>Pendientes</span>
              <span>{data.pendingOrders}</span>
            </div>
            <div className="bar-container">
              <div
                className="bar pending"
                style={{
                  width: `${(data.pendingOrders / data.totalOrders) * 100}%`
                }}
              />
            </div>
          </div>
          <div className="status-bar">
            <div className="status-label">
              <span>Canceladas</span>
              <span>{data.canceledOrders}</span>
            </div>
            <div className="bar-container">
              <div
                className="bar canceled"
                style={{
                  width: `${(data.canceledOrders / data.totalOrders) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="daily-sales-section">
        <h3>Ventas Diarias</h3>
        <SalesChart data={data.dailySales} />
      </div>

      <div className="monthly-sales-section">
        <h3>Ventas Mensuales</h3>
        <table className="sales-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Año</th>
              <th>Órdenes</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlySales.map((month, idx) => (
              <tr key={idx}>
                <td>{month.month}</td>
                <td>{month.year}</td>
                <td>{month.orders}</td>
                <td>${parseFloat(month.revenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== PRODUCTS REPORT =====
function ProductsReport({ data }) {
  return (
    <div className="products-report">
      <div className="metrics-grid">
        <div className="metric-box">
          <h4>Total Productos</h4>
          <p className="metric-value">{data.totalProducts}</p>
        </div>
        <div className="metric-box">
          <h4>Productos Activos</h4>
          <p className="metric-value">{data.activeProducts}</p>
        </div>
        <div className="metric-box">
          <h4>Valor Inventario</h4>
          <p className="metric-value">${parseFloat(data.totalInventoryValue).toFixed(2)}</p>
        </div>
        <div className="metric-box warning">
          <h4>Stock Bajo</h4>
          <p className="metric-value">{data.lowStockProducts}</p>
        </div>
      </div>

      <div className="top-products-section">
        <h3>🏆 Top 10 Productos Más Vendidos</h3>
        <div className="top-products-list">
          {data.topSellingProducts.map((product, idx) => (
            <div key={idx} className="top-product-item">
              <div className="product-rank">#{idx + 1}</div>
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} />
                ) : (
                  <div className="no-image">📦</div>
                )}
              </div>
              <div className="product-details">
                <h4>{product.productName}</h4>
                <p>{product.quantitySold} unidades vendidas</p>
              </div>
              <div className="product-revenue">
                ${parseFloat(product.revenue).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.lowStockDetails.length > 0 && (
        <div className="low-stock-section">
          <h3>⚠️ Productos con Stock Bajo</h3>
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockDetails.map((product, idx) => (
                <tr key={idx}>
                  <td>{product.productName}</td>
                  <td className={product.currentStock === 0 ? 'out-of-stock' : 'low-stock'}>
                    {product.currentStock}
                  </td>
                  <td>
                    <span className={`badge ${product.status === 'SIN STOCK' ? 'danger' : 'warning'}`}>
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== VENDORS REPORT =====
function VendorsReport({ data }) {
  return (
    <div className="vendors-report">
      <div className="report-header-stat">
        <h3>Total de Vendedores</h3>
        <p className="big-stat">{data.totalVendors}</p>
      </div>

      <div className="top-vendors-section">
        <h3>🏆 Top 10 Vendedores</h3>
        <div className="vendors-list">
          {data.topVendors.map((vendor, idx) => (
            <div key={idx} className="vendor-card">
              <div className="vendor-rank">#{idx + 1}</div>
              <div className="vendor-info">
                <h4>{vendor.vendorName}</h4>
                <div className="vendor-stats">
                  <span>📦 {vendor.totalOrders} órdenes</span>
                  <span>💰 ${parseFloat(vendor.totalRevenue).toFixed(2)}</span>
                  <span>📊 Promedio: ${parseFloat(vendor.averageOrderValue).toFixed(2)}</span>
                </div>
              </div>
              <div className="vendor-performance">
                <div className="performance-bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min(
                        (vendor.totalOrders / data.topVendors[0].totalOrders) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== CLIENTS REPORT =====
function ClientsReport({ data }) {
  return (
    <div className="clients-report">
      <div className="metrics-grid">
        <div className="metric-box">
          <h4>Total Clientes</h4>
          <p className="metric-value">{data.totalClients}</p>
        </div>
        <div className="metric-box">
          <h4>Clientes Activos</h4>
          <p className="metric-value">{data.activeClients}</p>
        </div>
      </div>

      <div className="top-clients-section">
        <h3>🏆 Top 10 Mejores Clientes</h3>
        <table className="clients-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Órdenes</th>
              <th>Total Gastado</th>
            </tr>
          </thead>
          <tbody>
            {data.topClients.map((client, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>{client.clientName}</td>
                <td>{client.clientPhone}</td>
                <td>{client.totalOrders}</td>
                <td className="amount">${parseFloat(client.totalSpent).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== SALES CHART (Simple Bar Chart) =====
function SalesChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="no-data">No hay datos para mostrar</div>;
  }

  const maxRevenue = Math.max(...data.map(d => parseFloat(d.revenue)));

  return (
    <div className="sales-chart">
      <div className="chart-bars">
        {data.map((day, idx) => (
          <div key={idx} className="chart-bar-container">
            <div
              className="chart-bar"
              style={{
                height: `${(parseFloat(day.revenue) / maxRevenue) * 200}px`
              }}
              title={`$${parseFloat(day.revenue).toFixed(2)}`}
            >
              <span className="bar-value">${parseFloat(day.revenue).toFixed(0)}</span>
            </div>
            <div className="bar-label">
              {new Date(day.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== TOP PRODUCTS CHART =====
function TopProductsChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="no-data">No hay datos para mostrar</div>;
  }

  const maxQuantity = Math.max(...data.map(d => d.quantitySold));

  return (
    <div className="top-products-chart">
      {data.map((product, idx) => (
        <div key={idx} className="product-bar-row">
          <div className="product-name">{product.productName}</div>
          <div className="product-bar-container">
            <div
              className="product-bar"
              style={{
                width: `${(product.quantitySold / maxQuantity) * 100}%`
              }}
            >
              <span className="bar-text">{product.quantitySold} unidades</span>
            </div>
          </div>
          <div className="product-amount">${parseFloat(product.revenue).toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}


// ===== ORDER DETAIL MODAL =====
function OrderDetailModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalle de Orden #{order.id.substring(0, 8)}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="order-detail">
          <div className="detail-section">
            <h4>Información General</h4>
            <p><strong>Estado:</strong> <span className={`badge ${order.estado.toLowerCase()}`}>{order.estado}</span></p>
            <p><strong>Vendedor:</strong> {order.vendedor}</p>
            <p><strong>Cliente:</strong> {order.cliente}</p>
            <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString()}</p>
            <p><strong>Total:</strong> <span className="total-amount">${parseFloat(order.total).toFixed(2)}</span></p>
          </div>

          {order.notas && (
            <div className="detail-section notes-section">
              <h4>📝 Notas</h4>
              <p>{order.notas}</p>
            </div>
          )}

          <div className="detail-section">
            <h4>Productos ({order.items.length})</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.productName}</td>
                    <td>{item.cantidad}</td>
                    <td>${parseFloat(item.precioUnitario).toFixed(2)}</td>
                    <td>${parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
