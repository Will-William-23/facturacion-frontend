import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Producto } from '../../interfaces/producto';
import { Proveedor } from '../../interfaces/proveedor';
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

  // LOGICA COMPRA PROVEEDORES
  modoProveedores: boolean = false;
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;
  productosProveedor: any[] = []; // Productos del proveedor seleccionado para compra

  private contieneLetrasRegex = /[a-zA-Z]/;

  // Inyectamos 'cd'
  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarProveedores();
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

  cargarProveedores() {
    this.api.getProveedores().subscribe({
      next: (data) => { this.proveedores = data; },
      error: (e) => console.error(e)
    });
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
    this.productoForm = { nombre: '', descripcion: '', precio: 0, stock: 0 };
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
        // Actualizamos el stock
        const nuevoStock = (producto.stock || 0) + producto.cantidadCompra;

        // Llamada a la API para actualizar el producto
        // IMPORTANTE: Asegúrate de enviar el objeto completo o solo lo necesario según tu backend.
        // Aquí enviamos todo el producto con el stock actualizado.
        const productoActualizado = { ...producto, stock: nuevoStock };
        // Eliminamos campos auxiliares antes de enviar si es necesario, 
        // pero normalmente el backend ignora campos extra o usamos una interfaz limpia.
        // TypeScript se quejará si no machea la interfaz, pero 'producto' es 'any' aqui temporalmente.
        delete productoActualizado.cantidadCompra;

        this.api.put(`productos/${producto.id}`, productoActualizado).subscribe({
          next: () => {
            Swal.fire('Compra realizada', 'Stock actualizado', 'success');
            producto.stock = nuevoStock; // Actualizamos vista local
            producto.cantidadCompra = 0; // Reseteamos input
            this.cargarProductos(); // Actualizamos la lista general también
            this.cargarProveedores(); // Actualizamos proveedores por si acaso (aunque los datos anidados tal vez no se refresquen solos sin recarga)
          },
          error: () => Swal.fire('Error', 'No se pudo procesar la compra', 'error')
        });
      }
    });

  }


}