import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import '../styles/NotificationCenter.css';

function NotificationCenter({ userRole }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userRole) return;

    console.log('🚀 Iniciando NotificationCenter para rol:', userRole);

    // Conectar a WebSocket
    NotificationService.connect((notification) => {
      handleNewNotification(notification);
    }, userRole);

    // Cargar notificaciones del localStorage
    const saved = localStorage.getItem('notifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotifications(parsed);
      updateUnreadCount(parsed);
    }

    // Pedir permisos de notificación
    requestNotificationPermission();

    return () => {
      NotificationService.disconnect();
    };
  }, [userRole]);

  const handleNewNotification = (notification) => {
    console.log('🔔 Nueva notificación:', notification);

    setNotifications(prev => {
      const updated = [notification, ...prev].slice(0, 50); // Máximo 50
      localStorage.setItem('notifications', JSON.stringify(updated));
      updateUnreadCount(updated);
      return updated;
    });

    // Mostrar notificación del navegador
    showBrowserNotification(notification);

    // Reproducir sonido
    playNotificationSound();
  };

  const updateUnreadCount = (notifs) => {
    const count = notifs.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id
      });
    }
  };

  const playNotificationSound = () => {
    // Crear beep con Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permiso de notificación:', permission);
      });
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      updateUnreadCount(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      updateUnreadCount(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      NEW_ORDER: '📦',
      ORDER_COMPLETED: '✅',
      LOW_STOCK: '⚠️',
      OUT_OF_STOCK: '🚨',
      RESTOCK_NEEDED: '📈',
      SYSTEM_ALERT: '🔔'
    };
    return icons[type] || '🔔';
  };

  const getNotificationClass = (type) => {
    const classes = {
      NEW_ORDER: 'info',
      ORDER_COMPLETED: 'success',
      LOW_STOCK: 'warning',
      OUT_OF_STOCK: 'danger',
      RESTOCK_NEEDED: 'info',
      SYSTEM_ALERT: 'info'
    };
    return classes[type] || 'info';
  };

  return (
    <div className="notification-center">
      <button 
        className="notification-bell" 
        onClick={() => setShowPanel(!showPanel)}
        title="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showPanel && (
        <>
          <div className="notification-overlay" onClick={() => setShowPanel(false)} />
          <div className="notification-panel">
            <div className="panel-header">
              <h3>Notificaciones</h3>
              <div className="panel-actions">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="btn-mark-read" title="Marcar todas como leídas">
                    ✓
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="btn-clear" title="Limpiar todas">
                    🗑️
                  </button>
                )}
                <button onClick={() => setShowPanel(false)} className="btn-close" title="Cerrar">
                  ✕
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <p>📭 No hay notificaciones</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${getNotificationClass(notification.type)} ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setShowPanel(false);
                      // Navegar si tiene URL
                      if (notification.targetUrl) {
                        window.location.href = notification.targetUrl;
                      }
                    }}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.timestamp).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {!notification.read && <div className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
