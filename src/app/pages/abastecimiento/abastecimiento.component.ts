import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';
import { Proveedor } from '../../interfaces/proveedor';
import { Producto } from '../../interfaces/producto';
import { MetodoPago } from '../../interfaces/metodo-pago';

@Component({
    selector: 'app-abastecimiento',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './abastecimiento.component.html',
    styleUrls: ['./abastecimiento.component.css']
})
export class AbastecimientoComponent implements OnInit {

    proveedores: Proveedor[] = [];
    proveedorSeleccionado: Proveedor | null = null;
    productosDelProveedor: Producto[] = [];
    metodosPago: MetodoPago[] = [];
    metodoPagoSeleccionado: number | null = null;

    // Para la seleccion de productos a abastecer
    // Estructura: { productoId: cantidad }
    cantidades: { [key: number]: number } = {};

    constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.cargarProveedores();
        this.cargarMetodosPago();
    }

    cargarProveedores() {
        this.api.getProveedores().subscribe({
            next: (data) => {
                console.log('Proveedores cargados:', data);
                this.proveedores = data;
                this.cd.detectChanges();
            },
            error: (e) => {
                console.error('Error cargando proveedores:', e);
                Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
            }
        });
    }

    cargarMetodosPago() {
        this.api.get('metodos-pago').subscribe(data => this.metodosPago = data);
    }

    seleccionarProveedor(proveedor: Proveedor) {
        this.proveedorSeleccionado = proveedor;
        this.productosDelProveedor = []; // Limpiar anterior
        this.cantidades = {};

        // Cargar productos. 
        // Opción A: Si el proveedor ya tiene la lista 'productos' cargada (depende del backend).
        if (proveedor.productos && proveedor.productos.length > 0) {
            this.productosDelProveedor = proveedor.productos;
        } else {
            // Opción B: Filtrar del endpoint de productos (si el backend no trae la lista)
            // O si el backend de proveedores retornó la lista vacia por ser LAZY.
            // Vamos a asumir que necesitamos filtrar todos los productos por proveedor si la lista esta vacia.
            this.api.get('productos').subscribe((todos: Producto[]) => {
                // Filtrar localmente (no ideal para grandes data pero ok para este MVP)
                // Asumimos que Producto tiene 'proveedor' o 'proveedorId'
                this.productosDelProveedor = todos.filter((p: any) => p.proveedor?.id === proveedor.id);
            });
        }
    }

    // Helper para sumar/restar cantidad
    ajustarCantidad(producto: Producto, delta: number) {
        if (!producto.id) return;
        const current = this.cantidades[producto.id] || 0;
        const nuevo = current + delta;
        if (nuevo >= 0) {
            this.cantidades[producto.id] = nuevo;
        }
    }

    guardarAbastecimiento() {
        const items = Object.keys(this.cantidades).map(id => ({
            productoId: Number(id),
            cantidad: this.cantidades[Number(id)]
        })).filter(i => i.cantidad > 0);

        if (items.length === 0) {
            Swal.fire('Atención', 'Seleccione al menos un producto con cantidad mayor a 0', 'warning');
            return;
        }

        if (!this.metodoPagoSeleccionado) {
            Swal.fire('Atención', 'Seleccione un método de pago', 'warning');
            return;
        }

        Swal.fire({ title: 'Procesando Compra...', didOpen: () => Swal.showLoading() });

        const payload = {
            proveedorId: this.proveedorSeleccionado?.id,
            metodoPagoId: this.metodoPagoSeleccionado,
            items: items
        };

        this.api.post('compras', payload).subscribe({
            next: () => {
                Swal.fire('Éxito', 'Compra registrada y Factura generada', 'success');
                // Recargar productos del proveedor para ver el stock actualizado
                if (this.proveedorSeleccionado) this.seleccionarProveedor(this.proveedorSeleccionado);
            },
            error: (e) => {
                console.error(e);
                Swal.fire('Error', 'No se pudo registrar la compra', 'error');
            }
        });
    }
}
