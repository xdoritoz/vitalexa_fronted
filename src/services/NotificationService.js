import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class NotificationService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = [];
    this.connected = false;
  }

  connect(onMessageReceived, userRole = 'vendedor') {
    const socket = new SockJS('http://localhost:8080/ws');
    this.stompClient = Stomp.over(socket);

    // Desactivar logs de debug
    this.stompClient.debug = () => {};

    this.stompClient.connect({}, (frame) => {
      console.log('✅ WebSocket conectado:', frame);
      this.connected = true;

      // Suscribirse según el rol
      if (userRole === 'admin' || userRole === 'owner') {
        this.subscriptions.push(
          this.stompClient.subscribe('/topic/admin/notifications', (message) => {
            const notification = JSON.parse(message.body);
            console.log('📬 Notificación admin recibida:', notification);
            onMessageReceived(notification);
          })
        );

        this.subscriptions.push(
          this.stompClient.subscribe('/topic/owner/notifications', (message) => {
            const notification = JSON.parse(message.body);
            console.log('📬 Notificación owner recibida:', notification);
            onMessageReceived(notification);
          })
        );
      }

      // Todos pueden recibir notificaciones generales
      this.subscriptions.push(
        this.stompClient.subscribe('/topic/notifications', (message) => {
          const notification = JSON.parse(message.body);
          console.log('📬 Notificación general recibida:', notification);
          onMessageReceived(notification);
        })
      );
    }, (error) => {
      console.error('❌ Error en WebSocket:', error);
      this.connected = false;
      // Reintentar conexión después de 5 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando conexión WebSocket...');
        this.connect(onMessageReceived, userRole);
      }, 5000);
    });
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.stompClient.disconnect();
      this.connected = false;
      console.log('🔌 Desconectado de WebSocket');
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new NotificationService();
