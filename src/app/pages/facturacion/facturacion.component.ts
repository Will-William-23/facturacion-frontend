import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { Producto } from '../../interfaces/producto';
import { DetalleVenta, FacturaRequest } from '../../interfaces/factura';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent implements OnInit {

  clientes: Cliente[] = [];
  productos: Producto[] = [];

  clienteSeleccionadoId: number | null = null;
  productoSeleccionadoId: number | null = null;
  cantidad: number = 1;
  formaPagoSeleccionada: string = '01'; // Por defecto Efectivo

  clienteActual: Cliente | null = null;
  productoActual: Producto | null = null;

  carrito: DetalleVenta[] = [];
  subtotal: number = 0;
  iva: number = 0;
  total: number = 0;
  ivaPorcentaje: number = 0.15; 

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos() {
    this.api.get('clientes').subscribe(data => this.clientes = data);
    this.api.get('productos').subscribe(data => this.productos = data);
  }

  onClienteChange() {
    this.clienteActual = this.clientes.find(c => c.id == this.clienteSeleccionadoId) || null;
  }

  onProductoChange() {
    this.productoActual = this.productos.find(p => p.id == this.productoSeleccionadoId) || null;
  }

  agregarProducto() {
    if (!this.productoActual || this.cantidad <= 0) return;

    if (this.cantidad > this.productoActual.stock) {
      Swal.fire('Stock Insuficiente', `Solo quedan ${this.productoActual.stock}.`, 'warning');
      return;
    }

    const subtotalLinea = this.productoActual.precio * this.cantidad;

    this.carrito.push({
      producto: { 
        id: this.productoActual.id!, 
        nombre: this.productoActual.nombre, 
        precio: this.productoActual.precio,
        grabaIva: this.productoActual.grabaIva 
      },
      cantidad: this.cantidad,
      subtotal: subtotalLinea
    });

    this.calcularTotales();
    
    const Toast = Swal.mixin({
      toast: true, position: 'top-end', showConfirmButton: false, timer: 1000, timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: 'Agregado' });

    this.productoSeleccionadoId = null;
    this.productoActual = null;
    this.cantidad = 1;
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales() {
    this.subtotal = 0;
    this.iva = 0;
    this.carrito.forEach(item => {
      const linea = item.subtotal || 0;
      this.subtotal += linea;
      if (item.producto.grabaIva) {
         this.iva += linea * this.ivaPorcentaje;
      }
    });
    this.total = this.subtotal + this.iva;
  }

  procesarFactura() {
    if (!this.clienteSeleccionadoId || this.carrito.length === 0) {
      Swal.fire('Faltan Datos', 'Seleccione cliente y productos.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Procesando Venta...',
      text: 'Generando XML, Firmando y Enviando al SRI',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const factura: FacturaRequest = {
      cliente: { id: this.clienteSeleccionadoId },
      formaPago: this.formaPagoSeleccionada, // ENVIAMOS EL PAGO ELEGIDO
      detalles: this.carrito.map(item => ({
        producto: { id: item.producto.id },
        cantidad: item.cantidad
      }))
    };

    this.api.crearFactura(factura).subscribe({
      next: (resp) => {
        Swal.fire({
          title: '¡Venta Exitosa!',
          html: `
            <div class="text-start">
              <p><strong>Factura ID:</strong> ${resp.id}</p>
              <p><strong>Estado SRI:</strong> <span class="badge bg-success">${resp.estadoSri}</span></p>
              <p><strong>Clave Acceso:</strong> <small>${resp.claveAcceso || 'Generada'}</small></p>
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Nueva Venta',
          cancelButtonText: 'Terminar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.limpiarFormulario();
          } else {
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire('Error', 'No se pudo procesar.', 'error');
      }
    });
  }

  limpiarFormulario() {
    this.carrito = [];
    this.subtotal = 0; this.iva = 0; this.total = 0;
    this.clienteSeleccionadoId = null;
    this.clienteActual = null;
    this.productoSeleccionadoId = null;
    this.productoActual = null;
    this.cantidad = 1;
    this.formaPagoSeleccionada = '01';
    this.cargarDatos();
  }
}