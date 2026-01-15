import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Asegúrate de cambiar esto si subes a AWS (ej: [http://18.217.76.67:8080](http://18.217.76.67:8080))
  private apiUrl = 'http://localhost:8080'; 
  
  private tokenKey = 'authToken';
  private userKey = 'authUser';
  private roleKey = 'authRole';

  constructor(private http: HttpClient) { }

  // --- AUTENTICACIÓN ---

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  saveSession(token: string, username: string, role: string): void {
    // CAMBIO CLAVE: Usamos sessionStorage en lugar de localStorage.
    // sessionStorage vive mientras la pestaña esté abierta (sobrevive al F5).
    // Si cierras el navegador, se borra automáticamente.
    sessionStorage.setItem(this.tokenKey, token);
    sessionStorage.setItem(this.userKey, username);
    sessionStorage.setItem(this.roleKey, role);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return sessionStorage.getItem(this.userKey);
  }

  getRole(): string | null {
    return sessionStorage.getItem(this.roleKey);
  }

  logout(): void {
    sessionStorage.clear();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // --- MÉTODOS GENÉRICOS ---

  get(endpoint: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${endpoint}`, { headers: this.getAuthHeaders() });
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${endpoint}`, data, { headers: this.getAuthHeaders() });
  }

  put(endpoint: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${endpoint}`, data, { headers: this.getAuthHeaders() });
  }

  delete(endpoint: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${endpoint}`, { headers: this.getAuthHeaders() });
  }

  // Método específico para facturación
  crearFactura(factura: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas`, factura, { headers: this.getAuthHeaders() });
  }

  // Método para configuración
  getConfig(): Observable<any> { 
    return this.http.get(`${this.apiUrl}/configuracion`, { headers: this.getAuthHeaders() }); 
  }
  
  updateConfig(data: any): Observable<any> { 
    return this.http.put(`${this.apiUrl}/configuracion`, data, { headers: this.getAuthHeaders() }); 
  }

  // Método para descargar PDF
  descargarPDF(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${endpoint}`, { 
      headers: this.getAuthHeaders(),
      responseType: 'blob' 
    });
  }
  
  // Métodos específicos (Proveedores, Usuarios, Registro)
  getProveedores(): Observable<any> { return this.get('proveedores'); }
  createProveedor(data: any): Observable<any> { return this.post('proveedores', data); }
  updateProveedor(id: number, data: any): Observable<any> { return this.put(`proveedores/${id}`, data); }
  deleteProveedor(id: number): Observable<any> { return this.delete(`proveedores/${id}`); }

  getUsuarios(): Observable<any> { return this.get('usuarios'); }
  createUsuario(data: any): Observable<any> { return this.post('usuarios', data); }
  updateUsuario(id: number, data: any): Observable<any> { return this.put(`usuarios/${id}`, data); }
  deleteUsuario(id: number): Observable<any> { return this.delete(`usuarios/${id}`); }
  
  register(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, usuario);
  }
}