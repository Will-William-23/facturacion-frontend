import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client: Client;
  private dashboardSubject = new Subject<any>();
  
  // Variable reactiva para el estado (Inicia en falso)
  public isConnected$ = new BehaviorSubject<boolean>(false);

  public dashboardUpdates$ = this.dashboardSubject.asObservable();

  constructor() {
    this.client = new Client({
      // Asegúrate de usar la URL correcta (localhost o IP de AWS)
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-dashboard'),
      debug: (str) => console.log(str),
      reconnectDelay: 5000, // Intenta reconectar cada 5 seg si se cae
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = (frame) => {
      console.log('✅ Conectado al WebSocket');
      this.isConnected$.next(true); // AVISAR QUE ESTAMOS ON
      
      this.client.subscribe('/topic/dashboard', (message) => {
        if (message.body) {
          this.dashboardSubject.next(JSON.parse(message.body));
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('❌ Error en Broker: ' + frame.headers['message']);
      this.isConnected$.next(false); // AVISAR QUE ESTAMOS OFF
    };

    this.client.onWebSocketClose = () => {
      console.warn('⚠️ Conexión WebSocket cerrada');
      this.isConnected$.next(false); // AVISAR QUE ESTAMOS OFF
    };
  }

  public connect() {
    // Solo activamos si no está activo ya
    if (!this.client.active) {
      this.client.activate();
    }
  }

  public disconnect() {
    if (this.client.active) {
      this.client.deactivate();
      this.isConnected$.next(false);
    }
  }
}