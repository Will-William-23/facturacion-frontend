import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VentaService {

    constructor(private api: ApiService) { }

    realizarCompra(clienteId: number, items: any[]): Observable<any> {
        const payload = {
            clienteId: clienteId,
            items: items.map(item => ({
                productoId: item.producto.id,
                cantidad: item.cantidad
            }))
        };
        return this.api.post('ventas/comprar', payload);
    }
}
