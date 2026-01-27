import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Producto } from '../../interfaces/producto';
import Swal from 'sweetalert2';
import { FilterPipe } from '../../pipes/filter.pipe';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {

  productos: Producto[] = [];
  productoForm: Producto = { nombre: '', descripcion: '', precio: 0, stock: 0 };
  editando: boolean = false;
  searchText: string = '';
  private contieneLetrasRegex = /[a-zA-Z]/;

  // Variables para Abastecimiento
  proveedores: any[] = [];
  restockForm = { proveedorId: null, productoId: null, cantidad: 0 };
  productosDelProveedor: Producto[] = [];
  mostrarModalAbastecer: boolean = false;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarProductos();
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

  // --- LOGICA ABASTECIMIENTO ---
  cargarProveedores() {
    this.api.get('proveedores').subscribe(data => this.proveedores = data);
  }

  abrirAbastecer() {
    this.cargarProveedores();
    this.mostrarModalAbastecer = true;
    this.restockForm = { proveedorId: null, productoId: null, cantidad: 0 };
  }

  cerrarAbastecer() {
    this.mostrarModalAbastecer = false;
  }

  onProveedorChange() {
    if (this.restockForm.proveedorId) {
      // Filtramos productos que tienen asignado este proveedor
      this.productosDelProveedor = this.productos.filter(p => p.proveedor && p.proveedor.id == this.restockForm.proveedorId);
    }
  }

  guardarAbastecimiento() {
    if (!this.restockForm.productoId || this.restockForm.cantidad <= 0) {
      Swal.fire('Error', 'Seleccione producto y cantidad válida', 'warning');
      return;
    }

    // Buscar el producto seleccionado (de la lista general o filtrada)
    const producto = this.productos.find(p => p.id == this.restockForm.productoId);

    if (producto) {
      const nuevoStock = producto.stock + this.restockForm.cantidad;
      producto.stock = nuevoStock;

      // Actualizar en backend
      this.api.put(`productos/${producto.id}`, producto).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Stock abastecido correctamente', 'success');
          this.cerrarAbastecer();
          this.cargarProductos();
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar stock', 'error')
      });
    }
  }
  // -----------------------------

  editarProducto(producto: Producto) {
    this.editando = true;
    this.productoForm = { ...producto };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.productoForm.imagen = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
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
    if (!id) return;

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