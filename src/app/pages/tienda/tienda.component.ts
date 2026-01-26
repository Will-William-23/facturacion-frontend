import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { DetalleVenta, FacturaRequest } from '../../interfaces/factura';
import { FilterPipe } from '../../pipes/filter.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {

  productos: any[] = [];
  carrito: DetalleVenta[] = [];
  searchText: string = '';
  total: number = 0;
  
  clienteForm: Cliente = { cedula: '', nombre: '', apellido: '', direccion: '', email: '', telefono: '' };
  formaPago: string = '01';
  mostrarCheckout: boolean = false;
  
  usuarioNombre: string = '';
  usuarioRol: string = '';

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private telefonoRegex = /^[0-9+ ]{7,15}$/;

  constructor(private api: ApiService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.usuarioNombre = this.api.getUsername() || 'Invitado';
    this.usuarioRol = this.api.getRole() || 'CLIENTE';
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
  }

  // --- ALGORITMO DE CÉDULA ECUATORIANA (Módulo 10) ---
  validarCedulaEcuador(cedula: string): boolean {
    if (cedula.length !== 10) return false;
    
    // Verificar que sean solo números
    if (!/^\d+$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;

    const digitoVerificador = parseInt(cedula.substring(9, 10));
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula.substring(i, i + 1));
      if (i % 2 === 0) { // Posiciones impares se multiplican por 2
        digito = digito * 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
    }

    let decenaSuperior = Math.ceil(suma / 10) * 10;
    let resultado = decenaSuperior - suma;
    if (resultado === 10) resultado = 0;

    return resultado === digitoVerificador;
  }

  cargarProductos() {
    this.api.get('productos').subscribe({
      next: (data) => {
        this.productos = data.map((p: any) => ({ ...p, cantidadAComprar: 1 }));
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  agregarAlCarrito(prod: any) {
    if (prod.stock <= 0) { Swal.fire('Agotado', 'Sin stock.', 'warning'); return; }
    if (prod.cantidadAComprar <= 0) return;
    if (prod.cantidadAComprar > prod.stock) { Swal.fire('Stock Insuficiente', `Solo hay ${prod.stock}.`, 'warning'); return; }

    const existente = this.carrito.find(item => item.producto.id === prod.id);
    if (existente) {
      existente.cantidad += prod.cantidadAComprar;
      existente.subtotal = (existente.producto.precio || 0) * existente.cantidad;
    } else {
      this.carrito.push({
        producto: { id: prod.id, nombre: prod.nombre, precio: prod.precio, grabaIva: prod.grabaIva },
        cantidad: prod.cantidadAComprar,
        subtotal: prod.precio * prod.cantidadAComprar
      });
    }
    this.calcularTotal();
    prod.cantidadAComprar = 1;
    const Toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 1000 });
    Toast.fire({ icon: 'success', title: 'Agregado' });
  }

  eliminarDelCarrito(index: number) { this.carrito.splice(index, 1); this.calcularTotal(); }
  calcularTotal() { this.total = this.carrito.reduce((sum, i) => sum + (i.subtotal || 0), 0); }
  irPagar() { if (this.carrito.length > 0) this.mostrarCheckout = true; }
  cancelarPago() { this.mostrarCheckout = false; }

  finalizarCompra() {
    // 1. VALIDACIONES LOCALES
    if (!this.clienteForm.cedula || !this.clienteForm.nombre || !this.clienteForm.email) { 
        Swal.fire('Datos Incompletos', 'Llene todos los campos obligatorios.', 'warning'); 
        return; 
    }

    // Validar Cédula Real
    if (!this.validarCedulaEcuador(this.clienteForm.cedula)) {
        Swal.fire('Cédula Inválida', 'La cédula ingresada es incorrecta matemáticamente.', 'error');
        return;
    }

    // Validar Formatos
    if (!this.emailRegex.test(this.clienteForm.email)) {
        Swal.fire('Email Inválido', 'Ingrese un correo válido.', 'warning');
        return;
    }
    if (!this.telefonoRegex.test(this.clienteForm.telefono)) {
        Swal.fire('Teléfono Inválido', 'Solo números.', 'warning');
        return;
    }

    Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
    
    // 2. INTENTAR REGISTRAR CLIENTE
    this.api.post('clientes', this.clienteForm).subscribe({
      next: (clienteGuardado: any) => {
        // Éxito: Cliente nuevo -> Facturar
        this.enviarFactura(clienteGuardado.id);
      },
      error: (e) => {
          // Error: El backend nos dice por qué (Duplicado)
          if (e.status === 409) {
             const mensajeError = e.error?.error || 'El usuario ya existe.';
             Swal.fire('Error de Registro', mensajeError, 'error');
          } else {
             Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
          }
      }
    });
  }

  enviarFactura(clienteId: number) {
    const fac: FacturaRequest = { 
        cliente: { id: clienteId }, 
        formaPago: this.formaPago, 
        detalles: this.carrito.map(i => ({ producto: { id: i.producto.id }, cantidad: i.cantidad })) 
    };
    
    this.api.crearFactura(fac).subscribe({
      next: (r) => { 
          Swal.fire({
            title: '¡Compra Exitosa!',
            html: `Factura <strong>#${r.id}</strong> generada.<br>Estado SRI: <span class="badge bg-success">${r.estadoSri}</span>`,
            icon: 'success'
          }).then(() => { 
              this.carrito = []; 
              this.mostrarCheckout = false; 
              this.cargarProductos(); 
          }); 
      },
      error: () => Swal.fire('Error', 'No se pudo procesar la venta.', 'error')
    });
  }
}