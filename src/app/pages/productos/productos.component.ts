import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Producto } from '../../interfaces/producto';
import { Proveedor } from '../../interfaces/proveedor';
import { FilterPipe } from '../../pipes/filter.pipe';
import { SortPipe } from '../../pipes/sort.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe, SortPipe],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productoForm: Producto = { codigoPrincipal: '', nombre: '', descripcion: '', precio: 0, stock: 0, grabaIva: true };
  editando: boolean = false;

  // FILTROS Y ORDEN
  searchText: string = '';
  sortField: string = 'stock';
  sortDir: 'asc' | 'desc' = 'asc';

  // LOGICA COMPRA PROVEEDORES
  modoProveedores: boolean = false;
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;
  productosProveedor: any[] = [];

  private contieneLetrasRegex = /[a-zA-Z]/;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarProveedores();
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

  cargarProveedores() {
    this.api.getProveedores().subscribe({
      next: (data) => { this.proveedores = data; },
      error: (e) => console.error(e)
    });
  }

  cambiarOrden(campo: string) {
    if (this.sortField === campo) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = campo;
      this.sortDir = 'asc';
    }
  }

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
    this.productoForm = { codigoPrincipal: '', nombre: '', descripcion: '', precio: 0, stock: 0, grabaIva: true };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Excelente', msg, 'success');
    this.cancelarEdicion();
    this.cargarProductos();
  }
  // --- MÉTODOS MODO PROVEEDORES ---

  toggleModoProveedores() {
    this.modoProveedores = !this.modoProveedores;
    this.proveedorSeleccionado = null;
    this.productosProveedor = [];
  }

  seleccionarProveedor(prov: Proveedor) {
    this.proveedorSeleccionado = prov;
    // Mapeamos los productos y añadimos un campo 'cantidadCompra'
    this.productosProveedor = (prov.productos || []).map(p => ({ ...p, cantidadCompra: 0 }));
  }

  realizarCompra(producto: any) {
    if (!producto.cantidadCompra || producto.cantidadCompra <= 0) {
      Swal.fire('Error', 'Ingrese una cantidad válida', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar compra?',
      text: `Se añadirán ${producto.cantidadCompra} unidades al stock de ${producto.nombre}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, comprar'
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevoStock = (producto.stock || 0) + producto.cantidadCompra;
        const productoActualizado = { ...producto, stock: nuevoStock };
        delete productoActualizado.cantidadCompra;

        this.api.put(`productos/${producto.id}`, productoActualizado).subscribe({
          next: () => {
            Swal.fire('Compra realizada', 'Stock actualizado', 'success');
            producto.stock = nuevoStock;
            producto.cantidadCompra = 0;
            this.cargarProductos();
            this.cargarProveedores();
          },
          error: () => Swal.fire('Error', 'No se pudo procesar la compra', 'error')
        });
      }
    });

  }
}
