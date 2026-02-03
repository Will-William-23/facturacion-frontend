import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Producto } from '../../interfaces/producto';
import { FilterPipe } from '../../pipes/filter.pipe';
import { SortPipe } from '../../pipes/sort.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, FilterPipe, SortPipe],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  
  productos: Producto[] = [];
  productoForm: Producto = { codigoPrincipal: '', nombre: '', descripcion: '', precio: 0, stock: 0, grabaIva: true, imagenUrl: '' };
  editando: boolean = false;
  
  searchText: string = '';
  sortField: string = 'stock';
  sortDir: 'asc' | 'desc' = 'asc';
  
  // VARIABLES QUE FALTABAN
  puedeComprar: boolean = false;
  private contieneLetrasRegex = /[a-zA-Z]/;

  constructor(
      private api: ApiService, 
      private cd: ChangeDetectorRef,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    
    // Verificar si es Admin o Contador para mostrar botón de comprar stock
    const rol = this.api.getRole();
    this.puedeComprar = (rol === 'ADMIN' || rol === 'CONTADOR');
  }

  cargarProductos() {
    this.api.get('productos').subscribe({
      next: (data) => {
        this.productos = data;
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  // Función para el botón verde de la tabla
  irAComprar() {
      this.router.navigate(['/compras']);
  }

  cambiarOrden(campo: string) {
    if (this.sortField === campo) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = campo;
      this.sortDir = 'asc';
    }
  }

  editarProducto(p: Producto) {
    this.editando = true;
    this.productoForm = { ...p };
  }

  guardarProducto() {
    if (!this.productoForm.nombre.trim()) {
      Swal.fire('Atención', 'El nombre es obligatorio.', 'warning');
      return;
    }
    if (!this.contieneLetrasRegex.test(this.productoForm.nombre)) {
      Swal.fire('Nombre Inválido', 'El nombre debe contener letras.', 'warning');
      return;
    }
    if (this.productoForm.precio <= 0) {
      Swal.fire('Precio Inválido', 'El precio debe ser mayor a 0.', 'warning');
      return;
    }
    if (this.productoForm.stock < 0) {
      Swal.fire('Stock Inválido', 'No puede ser negativo.', 'warning');
      return;
    }

    Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

    const observable = (this.editando && this.productoForm.id)
      ? this.api.put(`productos/${this.productoForm.id}`, this.productoForm)
      : this.api.post('productos', this.productoForm);

    observable.subscribe({
      next: () => this.finalizarOperacion(this.editando ? 'Producto actualizado' : 'Producto creado'),
      error: () => Swal.fire('Error', 'No se pudo guardar.', 'error')
    });
  }

  eliminarProducto(id: number | undefined) {
    if(!id) return;
    Swal.fire({
      title: '¿Eliminar producto?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`productos/${id}`).subscribe({
          next: () => {
            this.cargarProductos();
            Swal.fire('Eliminado', 'Producto eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

  cancelarEdicion() {
    this.editando = false;
    this.productoForm = { codigoPrincipal: '', nombre: '', descripcion: '', precio: 0, stock: 0, grabaIva: true, imagenUrl: '' };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Excelente', msg, 'success');
    this.cargarProductos();
    this.cancelarEdicion();
  }
}