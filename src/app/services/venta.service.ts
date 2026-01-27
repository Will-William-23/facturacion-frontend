import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { MetodoPago } from '../interfaces/metodo-pago';

@Injectable({
    providedIn: 'root'
})
export class VentaService {

    constructor(private api: ApiService) { }

    getMetodosPago(): Observable<MetodoPago[]> {
        return this.api.get('metodos-pago');
    }

    realizarCompra(clienteId: number, items: any[], metodoPagoId: number): Observable<any> {
        const payload = {
            clienteId: clienteId,
            metodoPagoId: metodoPagoId,
            items: items.map(item => ({
                productoId: item.producto.id,
                cantidad: item.cantidad
            }))
        };
        return this.api.post('ventas/comprar', payload);
    }
}
