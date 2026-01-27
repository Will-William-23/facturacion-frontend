import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { Producto } from '../../interfaces/producto';
import { MetodoPago } from '../../interfaces/metodo-pago';
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
  metodosPago: MetodoPago[] = [];

  clienteSeleccionado: number | null = null;
  productoSeleccionado: number | null = null;
  metodoPagoSeleccionado: number | null = null;
  cantidad: number = 1;

  carrito: DetalleVenta[] = [];
  total: number = 0;

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.api.get('clientes').subscribe(data => this.clientes = data);
    this.api.get('productos').subscribe(data => this.productos = data);
    this.api.get('api/metodos-pago').subscribe(data => {
      this.metodosPago = data;
      // Seleccionar efectivo por defecto
      const efectivo = data.find((m: any) => m.codigo === '01');
      if (efectivo) this.metodoPagoSeleccionado = efectivo.id;
    });
  }

  agregarProducto() {
    if (!this.productoSeleccionado || this.cantidad <= 0) return;

    const prodReal = this.productos.find(p => p.id == this.productoSeleccionado);

    if (prodReal && prodReal.id) {
      if (this.cantidad > prodReal.stock) {
        Swal.fire('Stock Insuficiente', `Solo quedan ${prodReal.stock} unidades.`, 'warning');
        return;
      }

      const subtotal = prodReal.precio * this.cantidad;

      this.carrito.push({
        producto: { id: prodReal.id, nombre: prodReal.nombre, precio: prodReal.precio },
        cantidad: this.cantidad,
        subtotal: subtotal
      });

      this.calcularTotal();

      const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });
      Toast.fire({ icon: 'success', title: 'Producto agregado' });

      this.productoSeleccionado = null;
      this.cantidad = 1;
    }
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = this.carrito.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  procesarFactura() {
    if (!this.clienteSeleccionado || this.carrito.length === 0) {
      Swal.fire('Faltan Datos', 'Seleccione un cliente y agregue productos al carrito.', 'warning');
      return;
    }

    if (!this.metodoPagoSeleccionado) {
      Swal.fire('Falta Método de Pago', 'Seleccione un método de pago.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Procesando...',
      text: 'Autorizando en SRI y enviando WhatsApp...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const factura: any = {
      clienteId: this.clienteSeleccionado,
      metodoPagoId: this.metodoPagoSeleccionado,
      items: this.carrito.map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad
      }))
    };

    // CAMBIO CRITICO: Usar el endpoint de ventas, no el de facturas antiguo
    this.api.post('ventas/comprar', factura).subscribe({
      next: (resp) => {
        Swal.fire({
          title: '¡Venta Exitosa!',
          html: `
            <p><strong>ID Venta:</strong> ${resp.id}</p>
            <span class="text-success">✅ Factura SRI generada automáticamente</span>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Nueva Venta',
          cancelButtonText: 'Ir al Menú'
        }).then((result) => {
          if (result.isConfirmed) {
            this.limpiarFormulario();
          } else {
            this.router.navigate(['/menu']);
          }
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire('Error', 'No se pudo procesar la venta. Verifique conexión o stock.', 'error');
      }
    });
  }

  limpiarFormulario() {
    this.carrito = [];
    this.total = 0;
    this.clienteSeleccionado = null;
    this.productoSeleccionado = null;
    this.cantidad = 1;
    this.cargarDatos();
  }
}