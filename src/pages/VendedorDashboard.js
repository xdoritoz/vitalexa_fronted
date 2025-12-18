import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import '../styles/VendedorDashboard.css';

function VendedorDashboard() {
  const [activeTab, setActiveTab] = useState('nueva-venta');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="vendedor-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Vendedor - Vitalexa</h1>
        <div className="header-info">
          <span>👤 {localStorage.getItem('username')}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'nueva-venta' ? 'active' : ''} 
          onClick={() => setActiveTab('nueva-venta')}
        >
          🛒 Nueva Venta
        </button>
        <button 
          className={activeTab === 'mis-ventas' ? 'active' : ''} 
          onClick={() => setActiveTab('mis-ventas')}
        >
          📋 Mis Ventas
        </button>
        <button 
          className={activeTab === 'ventas-completadas' ? 'active' : ''} 
          onClick={() => setActiveTab('ventas-completadas')}
        >
          ✅ Completadas
        </button>
        <button 
          className={activeTab === 'clientes' ? 'active' : ''} 
          onClick={() => setActiveTab('clientes')}
        >
          👥 Clientes
        </button>
        <button 
          className={activeTab === 'productos' ? 'active' : ''} 
          onClick={() => setActiveTab('productos')}
        >
          📦 Productos
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'nueva-venta' && <NuevaVentaPanel />}
        {activeTab === 'mis-ventas' && <MisVentasPanel />}
        {activeTab === 'ventas-completadas' && <VentasCompletadasPanel />}
        {activeTab === 'clientes' && <ClientesPanel />}
        {activeTab === 'productos' && <ProductosPanel />}
      </div>
    </div>
  );
}

// ============================================
// PANEL NUEVA VENTA
// ============================================
function NuevaVentaPanel() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowNoClient, setAllowNoClient] = useState(false);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await client.get('/vendedor/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await client.get('/vendedor/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.cantidad >= product.stock) {
        alert('No hay suficiente stock disponible');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1,
        stockDisponible: product.stock
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.productId === productId);
    
    if (newQuantity > item.stockDisponible) {
      alert('No hay suficiente stock disponible');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, cantidad: newQuantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }

    if (!selectedClient && !allowNoClient) {
      alert('Selecciona un cliente o marca la casilla para confirmar venta sin cliente');
      return;
    }

    try {
      const orderData = {
        clientId: selectedClient || null,
        items: cart.map(item => ({
          productId: item.productId,
          cantidad: item.cantidad
        })),
        notas: notas.trim() || null
      };

      await client.post('/vendedor/orders', orderData);
      alert('¡Venta registrada exitosamente!');
      
      // Limpiar formulario
      setCart([]);
      setSelectedClient('');
      setAllowNoClient(false);
      setNotas('');
      fetchProducts();
    } catch (error) {
      console.error('Error al crear orden:', error);
      alert('Error al registrar la venta: ' + (error.response?.data?.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="nueva-venta-panel">
      <h2>🛒 Nueva Venta</h2>

      <div className="venta-layout">
        {/* SECCIÓN IZQUIERDA - PRODUCTOS */}
        <div className="productos-section">
          <h3>Productos Disponibles</h3>
          <div className="productos-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <img 
                  src={`http://localhost:8080/api/images/products/${product.imageUrl}`}
                  alt={product.nombre}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23e5e7eb" width="150" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="12" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESin Imagen%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="product-info">
                  <h4>{product.nombre}</h4>
                  <p className="product-price">${parseFloat(product.precio).toFixed(2)}</p>
                  <p className="product-stock">Stock: {product.stock}</p>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className="btn-add-cart"
                  >
                    {product.stock === 0 ? 'Sin Stock' : '+ Agregar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN DERECHA - CARRITO */}
        <div className="carrito-section">
          <h3>Carrito de Compra</h3>
          
          <div className="form-group">
            <label>Cliente</label>
            <select 
              value={selectedClient} 
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setAllowNoClient(false);
              }}
              disabled={allowNoClient}
            >
              <option value="">Selecciona un cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} - {c.telefono}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={allowNoClient}
                onChange={(e) => {
                  setAllowNoClient(e.target.checked);
                  if (e.target.checked) {
                    setSelectedClient('');
                  }
                }}
              />
              {' '}Venta sin cliente registrado (confirmo que estoy seguro)
            </label>
          </div>

          <div className="form-group">
            <label>Notas / Productos sin stock</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows="3"
              placeholder="Ej: Cliente solicita producto X sin stock, contactar proveedor..."
              style={{fontSize: '13px'}}
            />
            <small style={{color: '#6b7280', fontSize: '12px', marginTop: '5px', display: 'block'}}>
              💡 Usa este campo para solicitar productos sin stock o agregar instrucciones especiales
            </small>
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">El carrito está vacío</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.nombre}</h4>
                      <p>${parseFloat(item.precio).toFixed(2)} c/u</p>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQuantity(item.productId, item.cantidad - 1)}>-</button>
                      <input 
                        type="number" 
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                        min="1"
                        max={item.stockDisponible}
                      />
                      <button onClick={() => updateQuantity(item.productId, item.cantidad + 1)}>+</button>
                      <button 
                        className="btn-remove"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="cart-item-subtotal">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="cart-total">
            <h3>Total: ${calculateTotal().toFixed(2)}</h3>
          </div>

          <button 
            className="btn-finalizar-venta"
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || (!selectedClient && !allowNoClient)}
          >
            Finalizar Venta
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================
// PANEL venta completadas
// ============================================
function VentasCompletadasPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const fetchCompletedOrders = async () => {
    try {
      const response = await client.get('/vendedor/orders/my');
      // Filtrar solo las completadas
      const completed = response.data.filter(order => order.estado === 'COMPLETADO');
      setOrders(completed);
    } catch (error) {
      console.error('Error al cargar ventas completadas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="ventas-completadas-panel">
      <h2>✅ Ventas Completadas</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No tienes ventas completadas aún</p>
        </div>
      ) : (
        <div className="ventas-list">
          {orders.map(order => (
            <div key={order.id} className="venta-card completed">
              <div className="venta-header">
                <span className="venta-id">#{order.id.substring(0, 8)}</span>
                <span className="venta-status status-completado">
                  ✅ COMPLETADO
                </span>
              </div>

              <div className="venta-info">
                <p><strong>Cliente:</strong> {order.cliente || 'Sin cliente'}</p>
                <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString()}</p>
                <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                
                {order.notas && (
                  <div className="venta-notes">
                    <strong>📝 Notas:</strong>
                    <p>{order.notas}</p>
                  </div>
                )}
              </div>

              <details className="venta-details">
                <summary>Ver productos</summary>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.productName} - {item.cantidad} x ${parseFloat(item.precioUnitario).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





// ============================================
// PANEL CLIENTES (con opción de crear)
// ============================================
function ClientesPanel() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await client.get('/vendedor/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="clientes-panel">
      <div className="panel-header">
        <h2>👥 Clientes</h2>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="clientes-grid">
        {clients.map(cliente => (
          <div key={cliente.id} className="cliente-card">
            <h3>{cliente.nombre}</h3>
            <p>📧 {cliente.email}</p>
            <p>📞 {cliente.telefono}</p>
            <p>📍 {cliente.direccion || 'Sin dirección'}</p>
            <div className="cliente-stats">
              <span>💰 Compras: ${parseFloat(cliente.totalCompras || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ClientFormModal 
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// MODAL CREAR CLIENTE
// ============================================
function ClientFormModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await client.post('/vendedor/clients', formData);
      alert('Cliente creado exitosamente');
      onSuccess();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('Error al crear cliente: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Nuevo Cliente</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-save">
              {saving ? 'Guardando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// PANEL MIS VENTAS
// ============================================
function MisVentasPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      const response = await client.get('/vendedor/orders/my');
      // Filtrar solo pendientes y confirmadas (no completadas)
      const pending = response.data.filter(order => 
        order.estado === 'PENDIENTE' || order.estado === 'CONFIRMADO'
      );
      setOrders(pending);
    } catch (error) {
      console.error('Error al cargar mis ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="mis-ventas-panel">
      <h2>📋 Mis Ventas (En Proceso)</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No tienes ventas en proceso</p>
        </div>
      ) : (
        <div className="ventas-list">
          {orders.map(order => (
            <div key={order.id} className="venta-card">
              <div className="venta-header">
                <span className="venta-id">#{order.id.substring(0, 8)}</span>
                <span className={`venta-status status-${order.estado.toLowerCase()}`}>
                  {order.estado}
                </span>
              </div>

              <div className="venta-info">
                <p><strong>Cliente:</strong> {order.cliente || 'Sin cliente'}</p>
                <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString()}</p>
                <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                
                {order.notas && (
                  <div className="venta-notes">
                    <strong>📝 Notas:</strong>
                    <p>{order.notas}</p>
                  </div>
                )}
              </div>

              <details className="venta-details">
                <summary>Ver productos</summary>
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      {item.productName} - {item.cantidad} x ${parseFloat(item.precioUnitario).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// ============================================
// PANEL PRODUCTOS (Solo lectura)
// ============================================
function ProductosPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.get('/vendedor/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="productos-catalogo">
      <h2>📦 Catálogo de Productos</h2>

      <div className="productos-grid-catalogo">
        {products.map(product => (
          <div key={product.id} className="producto-card">
            <img 
              src={`http://localhost:8080/api/images/products/${product.imageUrl}`}
              alt={product.nombre}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESin Imagen%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="producto-info">
              <h3>{product.nombre}</h3>
              <p className="producto-descripcion">{product.descripcion}</p>
              <div className="producto-details">
                <span className="producto-precio">${parseFloat(product.precio).toFixed(2)}</span>
                <span className={`producto-stock ${product.stock <= 5 ? 'low' : ''}`}>
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendedorDashboard;
