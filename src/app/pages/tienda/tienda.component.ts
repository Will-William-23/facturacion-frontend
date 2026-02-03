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
  
  // Datos del Cliente (Formulario)
  clienteForm: Cliente = { cedula: '', nombre: '', apellido: '', direccion: '', email: '', telefono: '' };
  formaPago: string = '01';
  mostrarCheckout: boolean = false;
  
  usuarioNombre: string = '';
  usuarioRol: string = '';

  constructor(
    private api: ApiService, 
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.usuarioNombre = this.api.getUsername() || 'Invitado';
    this.usuarioRol = this.api.getRole() || 'CLIENTE';
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
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
    if (prod.stock <= 0) {
      Swal.fire('Agotado', 'Producto sin stock.', 'warning');
      return;
    }
    
    // Buscar si ya está en carrito para sumar
    const existente = this.carrito.find(item => item.producto.id === prod.id);

    if (existente) {
      existente.cantidad += prod.cantidadAComprar;
      existente.subtotal = (existente.producto.precio || 0) * existente.cantidad;
    } else {
      const item = {
        producto: { id: prod.id, nombre: prod.nombre, precio: prod.precio, grabaIva: prod.grabaIva },
        cantidad: prod.cantidadAComprar,
        subtotal: prod.precio * prod.cantidadAComprar
      };
      this.carrito.push(item);
    }

    this.calcularTotal();
    prod.cantidadAComprar = 1;

    const Toast = Swal.mixin({ toast: true, position: 'bottom-end', showConfirmButton: false, timer: 1000 });
    Toast.fire({ icon: 'success', title: 'Agregado' });
  }

  eliminarDelCarrito(index: number) { 
    this.carrito.splice(index, 1); 
    this.calcularTotal(); 
  }

  calcularTotal() { 
    this.total = this.carrito.reduce((sum, i) => sum + (i.subtotal || 0), 0); 
  }

  irPagar() { if (this.carrito.length > 0) this.mostrarCheckout = true; }
  cancelarPago() { this.mostrarCheckout = false; }

  // --- LÓGICA INTELIGENTE DE COMPRA ---
  finalizarCompra() {
    if (!this.clienteForm.cedula || !this.clienteForm.nombre) { 
        Swal.fire('Datos Incompletos', 'Llene los campos obligatorios.', 'warning'); 
        return; 
    }
    
    Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
    
    // 1. Intentamos crear el cliente
    this.api.post('clientes', this.clienteForm).subscribe({
      next: (clienteNuevo: any) => {
        // Si se creó, usamos su ID
        this.enviarFactura(clienteNuevo.id);
      },
      error: (err) => {
        // 2. Si falla (probablemente porque ya existe), lo buscamos
        console.warn("El cliente ya existe, buscándolo...", err);
        
        this.api.get('clientes').subscribe((lista: any[]) => {
            const clienteExistente = lista.find(c => c.cedula === this.clienteForm.cedula);
            
            if (clienteExistente) {
                // Lo encontramos, usamos su ID y actualizamos sus datos por si acaso
                // Opcional: Podríamos hacer un PUT aquí para actualizar dirección/email
                this.enviarFactura(clienteExistente.id);
            } else {
                Swal.fire('Error', 'No se pudo registrar ni encontrar al cliente.', 'error');
            }
        });
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
              this.cargarProductos(); // Actualizar stock
          }); 
      },
      error: () => Swal.fire('Error', 'No se pudo procesar la venta.', 'error')
    });
  }
}