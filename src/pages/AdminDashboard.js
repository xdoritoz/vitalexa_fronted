import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import client from '../api/client';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Administración - Vitalexa</h1>
        <div className="header-info">
          <span>👤 {localStorage.getItem('username')}</span>
          <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          📋 Órdenes Pendientes
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
        >
          📦 Gestión de Productos
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'orders' && <OrdersPanel />}
        {activeTab === 'products' && <ProductsPanel />}
      </div>
    </div>
  );
}

// ============================================
// PANEL DE ÓRDENES
// ============================================
function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('pending');

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

  const changeStatus = async (orderId, newStatus) => {
    try {
      await client.patch(`/admin/orders/${orderId}/status?status=${newStatus}`);
      fetchOrders();
      alert('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado: ' + (error.response?.data || error.message));
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.estado === 'PENDIENTE' || order.estado === 'CONFIRMADO';
    if (filter === 'completed') return order.estado === 'COMPLETADO';
    if (filter === 'all') return true;
    return order.estado === filter;
  });

  if (loading) {
    return <div className="loading">Cargando órdenes...</div>;
  }

  return (
    <div className="orders-panel">
      <div className="panel-header">
        <h2>📋 Gestión de Órdenes</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            ⏳ Pendientes
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            ✅ Completadas
          </button>
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            📊 Todas
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>No hay órdenes en esta categoría</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
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
                <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString()}</p>
                <p className="order-total"><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
                
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
                      {item.productName} - {item.cantidad} x ${parseFloat(item.precioUnitario).toFixed(2)}
                      <span className="item-subtotal">${parseFloat(item.subtotal).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="order-actions">
                {order.estado === 'CONFIRMADO' && (
                  <>
                    <button 
                      className="btn-edit"
                      onClick={() => setSelectedOrder(order)}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn-complete"
                      onClick={() => changeStatus(order.id, 'COMPLETADO')}
                    >
                      ✅ Completar
                    </button>
                  </>
                )}
                
                {order.estado === 'PENDIENTE' && (
                  <button 
                    className="btn-complete"
                    onClick={() => changeStatus(order.id, 'CONFIRMADO')}
                  >
                    ✓ Confirmar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}


function EditOrderModal({ order, onClose, onSuccess }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    clientId: null,
    items: [],
    notas: order.notas || ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Cargando clientes y productos...');
      
      const [clientsRes, productsRes] = await Promise.all([
        client.get('/admin/clients'),
        client.get('/admin/products')
      ]);
      
      console.log('Clientes recibidos:', clientsRes.data);
      console.log('Productos recibidos:', productsRes.data);
      
      setClients(clientsRes.data);
      setProducts(productsRes.data);
      
      // Inicializar items de la orden
      const mappedItems = order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      }));
      
      // Encontrar el cliente actual por nombre
      let currentClientId = null;
      if (order.cliente && order.cliente !== 'Sin cliente') {
        const foundClient = clientsRes.data.find(c => 
          c.nombre.toLowerCase() === order.cliente.toLowerCase()
        );
        if (foundClient) {
          currentClientId = foundClient.id;
          console.log('Cliente encontrado:', foundClient);
        } else {
          console.warn('No se encontró el cliente:', order.cliente);
        }
      }
      
      setFormData({
        clientId: currentClientId,
        items: mappedItems,
        notas: order.notas || ''
      });
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al cargar datos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Debe haber al menos un producto en la orden');
      return;
    }

    const validItems = formData.items.filter(item => item.productId);
    
    if (validItems.length === 0) {
      alert('No hay productos válidos en la orden');
      return;
    }
    
    try {
      const payload = {
        clientId: formData.clientId || null,
        items: validItems.map(item => ({
          productId: item.productId,
          cantidad: item.cantidad
        })),
        notas: formData.notas || null
      };

      console.log('Enviando actualización:', payload);
      
      await client.put(`/admin/orders/${order.id}`, payload);
      
      alert('Orden actualizada correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      alert('Error al actualizar orden: ' + (error.response?.data?.message || error.message));
    }
  };

  const addItem = (product) => {
    const existing = formData.items.find(i => i.productId === product.id);
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(i =>
          i.productId === product.id 
            ? {...i, cantidad: i.cantidad + 1} 
            : i
        )
      });
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          productId: product.id,
          productName: product.nombre,
          cantidad: 1,
          precioUnitario: product.precio
        }]
      });
    }
  };

  const removeItem = (productId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.productId !== productId)
    });
  };

  const updateQuantity = (productId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      removeItem(productId);
      return;
    }
    
    setFormData({
      ...formData,
      items: formData.items.map(i =>
        i.productId === productId 
          ? {...i, cantidad: parseInt(nuevaCantidad)} 
          : i
      )
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content-large">
          <div className="loading">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Orden #{order.id.substring(0, 8)}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-order-form">
          <div className="form-section">
            <h4>Cliente</h4>
            {clients.length === 0 ? (
              <p style={{color: '#dc2626', fontSize: '14px'}}>
                ⚠️ No hay clientes disponibles
              </p>
            ) : (
              <select 
                value={formData.clientId || ''}
                onChange={(e) => setFormData({...formData, clientId: e.target.value || null})}
              >
                <option value="">Sin cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} - {c.telefono}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-section">
            <h4>Productos en la orden ({formData.items.length})</h4>
            {formData.items.length === 0 ? (
              <p style={{color: '#dc2626', fontSize: '14px'}}>
                ⚠️ No hay productos en la orden
              </p>
            ) : (
              <div className="order-items-list">
                {formData.items.map((item, index) => (
                  <div key={item.productId || index} className="edit-item">
                    <span>{item.productName}</span>
                    <div className="item-controls">
                      <button 
                        type="button" 
                        onClick={() => updateQuantity(item.productId, item.cantidad - 1)}
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <button 
                        type="button" 
                        onClick={() => updateQuantity(item.productId, item.cantidad + 1)}
                      >
                        +
                      </button>
                      <button 
                        type="button" 
                        className="btn-remove-item" 
                        onClick={() => removeItem(item.productId)}
                      >
                        🗑️
                      </button>
                    </div>
                    <span className="item-price">
                      ${(item.precioUnitario * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h4>Agregar más productos</h4>
            {products.length === 0 ? (
              <p style={{color: '#dc2626', fontSize: '14px'}}>
                ⚠️ No hay productos disponibles
              </p>
            ) : (
              <div className="products-quick-add">
                {products.filter(p => p.active).map(product => (
                  <button 
                    key={product.id}
                    type="button"
                    className="btn-quick-add"
                    onClick={() => addItem(product)}
                  >
                    + {product.nombre} (${parseFloat(product.precio).toFixed(2)})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-section">
            <h4>Notas</h4>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({...formData, notas: e.target.value})}
              rows="3"
              placeholder="Notas adicionales sobre la orden..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





// ============================================
// MODAL DE DETALLE DE ORDEN
// ============================================
function OrderDetailModal({ order, onClose, onStatusChange }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalle de Orden #{order.id.substring(0, 8)}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h4>Información General</h4>
            <p><strong>Estado:</strong> <span className={`status-badge status-${order.estado.toLowerCase()}`}>{order.estado}</span></p>
            <p><strong>Fecha:</strong> {new Date(order.fecha).toLocaleString()}</p>
            <p><strong>Cliente:</strong> {order.cliente}</p>
            <p><strong>Vendedor:</strong> {order.vendedor}</p>
          </div>

          <div className="detail-section">
            <h4>Productos</h4>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
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
            <div className="total-row">
              <strong>TOTAL:</strong> ${parseFloat(order.total).toFixed(2)}
            </div>
          </div>

          <div className="modal-actions">
            {order.estado === 'CONFIRMADO' && (
              <button 
                className="btn-complete-full" 
                onClick={() => onStatusChange(order.id, 'COMPLETADO')}
              >
                Marcar como Completada
              </button>
            )}
            <button 
              className="btn-cancel-order" 
              onClick={() => onStatusChange(order.id, 'CANCELADO')}
            >
              Cancelar Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PANEL DE PRODUCTOS
// ============================================
function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.get('/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

const toggleStatus = async (productId, currentStatus) => {
  try {
    // ⚠️ Cambiar de /status a /estado
    await client.patch(`/admin/products/${productId}/estado?activo=${!currentStatus}`);
    fetchProducts();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    alert('Error al cambiar el estado del producto');
  }
};


  const deleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await client.delete(`/admin/products/${productId}`);
      alert('Producto eliminado');
      fetchProducts();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  return (
    <div className="products-panel">
      <div className="panel-header">
        <h2>📦 Gestión de Productos</h2>
        <button className="btn-add" onClick={() => setShowForm(true)}>
          + Nuevo Producto
        </button>
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className={`product-card ${!product.active ? 'inactive' : ''}`}>
            <div className="product-image">
              <img 
                src={`http://localhost:8080/api/images/products/${product.imageUrl}`} 
                alt={product.nombre}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ESin Imagen%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="product-info">
              <h3>{product.nombre}</h3>
              <p className="product-description">{product.descripcion}</p>
              <div className="product-details">
                <span className="product-price">${parseFloat(product.precio).toFixed(2)}</span>
                <span className="product-stock">Stock: {product.stock}</span>
              </div>
              <span className={`product-status ${product.active ? 'active' : 'inactive'}`}>
                {product.active ? '✅ Activo' : '❌ Inactivo'}
              </span>
            </div>

            <div className="product-actions">
              <button onClick={() => setEditingProduct(product)}>✏️ Editar</button>
              <button onClick={() => toggleStatus(product.id, product.active)}>
                {product.active ? '🔒 Desactivar' : '🔓 Activar'}
              </button>
              <button className="btn-delete" onClick={() => deleteProduct(product.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editingProduct) && (
        <ProductFormModal 
          product={editingProduct}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            fetchProducts();
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// FORMULARIO DE PRODUCTO (Modal)
// ============================================
function ProductFormModal({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: product?.nombre || '',
    descripcion: product?.descripcion || '',
    precio: product?.precio || '',
    stock: product?.stock || '',
    active: product?.active !== undefined ? product.active : true
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('precio', formData.precio);
      formDataToSend.append('stock', formData.stock);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (product) {
        // Actualizar - agregar el campo active
        formDataToSend.append('active', formData.active);
        
        await client.put(`/admin/products/${product.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Producto actualizado exitosamente');
      } else {
        // Crear nuevo
        await client.post('/admin/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Producto creado exitosamente');
      }

      onSuccess();
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      
      const errorMsg = error.response?.data?.message || 
                      error.response?.data || 
                      error.message || 
                      'Error desconocido';
      
      alert('Error al guardar el producto: ' + errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
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
            <label>Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({...formData, precio: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Imagen del producto {product ? '(opcional - dejar vacío para mantener actual)' : ''}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            
            {product?.imageUrl && !imageFile && (
              <div className="current-image">
                <p style={{fontSize: '12px', color: '#6b7280', marginTop: '5px'}}>
                  Imagen actual: {product.imageUrl}
                </p>
                <img 
                  src={`http://localhost:8080/api/images/products/${product.imageUrl}`}
                  alt="Current"
                  style={{maxWidth: '200px', marginTop: '10px', borderRadius: '8px'}}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {imageFile && (
              <p style={{fontSize: '12px', color: '#10b981', marginTop: '5px'}}>
                ✅ Nueva imagen seleccionada: {imageFile.name}
              </p>
            )}
          </div>

          {product && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                {' '}Producto activo
              </label>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={uploading} className="btn-save">
              {uploading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default AdminDashboard;
