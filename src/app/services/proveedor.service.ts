import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Proveedor } from '../interfaces/proveedor';

@Injectable({
    providedIn: 'root'
})
export class ProveedorService {

    constructor(private api: ApiService) { }

    getProveedores(): Observable<Proveedor[]> {
        return this.api.get('proveedores');
    }

    createProveedor(proveedor: Proveedor): Observable<Proveedor> {
        return this.api.post('proveedores', proveedor);
    }

    updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
        return this.api.put(`proveedores/${id}`, proveedor);
    }

    deleteProveedor(id: number): Observable<void> {
        return this.api.delete(`proveedores/${id}`);
    }
}
