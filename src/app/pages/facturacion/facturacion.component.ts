import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { Producto } from '../../interfaces/producto';
import { DetalleVenta, FacturaRequest } from '../../interfaces/factura';
import Swal from 'sweetalert2'; // Importamos SweetAlert

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent implements OnInit {

  clientes: Cliente[] = [];
  productos: Producto[] = [];

  clienteSeleccionado: number | null = null;
  productoSeleccionado: number | null = null;
  cantidad: number = 1;

  carrito: DetalleVenta[] = [];
  total: number = 0;

  // Método de Pago
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia' = 'efectivo';
  
  // Efectivo
  montoRecibido: number = 0;
  cambio: number = 0;
  
  // Tarjeta
  tipoTarjeta: 'visa' | 'mastercard' = 'visa';
  ultimosCuatroDigitos: string = '';
  codigoAutorizacion: string = '';
  
  // Transferencia
  banco: string = '';
  numeroComprobante: string = '';
  fechaPago: string = '';

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.api.get('clientes').subscribe(data => this.clientes = data);
    this.api.get('productos').subscribe(data => this.productos = data);
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

  cambiarMetodoPago(metodo: 'efectivo' | 'tarjeta' | 'transferencia') {
    this.metodoPago = metodo;
    this.limpiarCamposPago();
  }

  limpiarCamposPago() {
    this.montoRecibido = 0;
    this.cambio = 0;
    this.tipoTarjeta = 'visa';
    this.ultimosCuatroDigitos = '';
    this.codigoAutorizacion = '';
    this.banco = '';
    this.numeroComprobante = '';
    this.fechaPago = '';
  }

  calcularCambio() {
    if (this.montoRecibido >= this.total) {
      this.cambio = this.montoRecibido - this.total;
    } else {
      this.cambio = 0;
    }
  }

  validarMetodoPago(): boolean {
    if (this.metodoPago === 'efectivo') {
      if (this.montoRecibido < this.total) {
        Swal.fire('Monto Insuficiente', 'El monto recibido debe ser mayor o igual al total.', 'warning');
        return false;
      }
    } else if (this.metodoPago === 'tarjeta') {
      if (!this.ultimosCuatroDigitos || !this.codigoAutorizacion) {
        Swal.fire('Campos Incompletos', 'Complete los datos de la tarjeta.', 'warning');
        return false;
      }
    } else if (this.metodoPago === 'transferencia') {
      if (!this.banco || !this.numeroComprobante || !this.fechaPago) {
        Swal.fire('Campos Incompletos', 'Complete los datos de la transferencia.', 'warning');
        return false;
      }
    }
    return true;
  }

  procesarFactura() {
    if (!this.clienteSeleccionado || this.carrito.length === 0) {
      Swal.fire('Faltan Datos', 'Seleccione un cliente y agregue productos al carrito.', 'warning');
      return;
    }

    if (!this.validarMetodoPago()) {
      return;
    }

    Swal.fire({
      title: 'Procesando...',
      text: 'Autorizando en SRI y enviando WhatsApp...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    // Preparar detalles del pago según el método
    let detallesPago: any = { metodoPago: this.metodoPago };
    
    if (this.metodoPago === 'efectivo') {
      detallesPago.montoRecibido = this.montoRecibido;
      detallesPago.cambio = this.cambio;
    } else if (this.metodoPago === 'tarjeta') {
      detallesPago.tipoTarjeta = this.tipoTarjeta;
      detallesPago.ultimosCuatroDigitos = this.ultimosCuatroDigitos;
      detallesPago.codigoAutorizacion = this.codigoAutorizacion;
    } else if (this.metodoPago === 'transferencia') {
      detallesPago.banco = this.banco;
      detallesPago.numeroComprobante = this.numeroComprobante;
      detallesPago.fechaPago = this.fechaPago;
    }

    const factura: FacturaRequest = {
      cliente: { id: this.clienteSeleccionado },
      detalles: this.carrito.map(item => ({
        producto: { id: item.producto.id },
        cantidad: item.cantidad
      })),
      metodoPago: this.metodoPago,
      detallesPago: detallesPago
    };

    this.api.crearFactura(factura).subscribe({
      next: (resp) => {
        Swal.fire({
          title: '¡Factura Exitosa!',
          html: `
            <p><strong>ID Factura:</strong> ${resp.id}</p>
            <p><strong>Estado SRI:</strong> ${resp.estadoSri}</p>
            <br>
            <span class="text-success">✅ Notificación de WhatsApp enviada</span>
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
        console.error('Error completo:', e);
        console.error('Mensaje:', e.error);
        const errorMsg = e.error && typeof e.error === 'string' ? e.error : 'No se pudo procesar la factura. Verifique conexión o stock.';
        Swal.fire('Error', errorMsg, 'error');
      }
    });
  }

  limpiarFormulario() {
    this.carrito = [];
    this.limpiarCamposPago();
    this.total = 0;
    this.clienteSeleccionado = null;
    this.productoSeleccionado = null;
    this.cantidad = 1;
    this.cargarDatos();
  }
}
