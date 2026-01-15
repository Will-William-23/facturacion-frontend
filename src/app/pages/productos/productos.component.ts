import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Producto } from '../../interfaces/producto';
import Swal from 'sweetalert2';
import { FilterPipe } from '../../pipes/filter.pipe'; // <-- Importar Pipe
@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe], // <-- Agregar Pipe
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  
  productos: Producto[] = [];
  productoForm: Producto = { nombre: '', descripcion: '', precio: 0, stock: 0 };
  editando: boolean = false;
  searchText: string = ''; // <-- Variable para el buscador
  private contieneLetrasRegex = /[a-zA-Z]/;

  // Inyectamos 'cd'
  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos() {
    this.api.get('productos').subscribe({
      next: (data) => {
        this.productos = data;
        this.cd.detectChanges(); // <-- ESTO FUERZA LA ACTUALIZACIÓN VISUAL
      },
      error: (e) => console.error(e)
    });
  }

  editarProducto(producto: Producto) {
    this.editando = true;
    this.productoForm = { ...producto };
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
      title: '¿Eliminar producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar'
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
    this.productoForm = { nombre: '', descripcion: '', precio: 0, stock: 0 };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Excelente', msg, 'success');
    this.cancelarEdicion();
    this.cargarProductos();
  }
}