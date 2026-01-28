import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Proveedor } from '../../interfaces/proveedor';
import { FilterPipe } from '../../pipes/filter.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  form: Proveedor = {
    ruc: '', nombreEmpresa: '', contactoNombre: '', telefono: '',
    email: '', direccion: '', categoria: 'General', productos: []
  };
  editando: boolean = false;
  searchText: string = '';

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private telefonoRegex = /^[0-9+ ]{7,15}$/;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void { this.cargar(); }

  cargar() {
    this.api.getProveedores().subscribe({
      next: (data) => { this.proveedores = data; this.cd.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  // --- VALIDACIÓN DE RUC ECUATORIANO ---
  validarRuc(ruc: string): boolean {
    if (ruc.length !== 13) return false;
    if (!ruc.endsWith('001')) return false;

    const provincia = parseInt(ruc.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;

    return true;
  }

  editar(item: Proveedor) {
    this.editando = true;
    this.form = { ...item };
  }

  guardar() {
    // VALIDACIONES
    if (!this.validarRuc(this.form.ruc)) {
      Swal.fire('RUC Inválido', 'Debe tener 13 dígitos, empezar con código de provincia válido y terminar en 001.', 'error');
      return;
    }
    if (!this.form.nombreEmpresa.trim()) {
      Swal.fire('Campo Vacío', 'El nombre de la empresa es obligatorio.', 'warning');
      return;
    }
    if (this.form.email && !this.emailRegex.test(this.form.email)) {
      Swal.fire('Email Inválido', 'Formato incorrecto.', 'warning');
      return;
    }
    if (this.form.telefono && !this.telefonoRegex.test(this.form.telefono)) {
      Swal.fire('Teléfono Inválido', 'Solo números.', 'warning');
      return;
    }

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    const obs = (this.editando && this.form.id)
      ? this.api.updateProveedor(this.form.id, this.form)
      : this.api.createProveedor(this.form);

    obs.subscribe({
      next: () => {
        Swal.fire('Éxito', 'Proveedor guardado correctamente', 'success');
        this.cancelar();
        this.cargar();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar (¿RUC Duplicado?)', 'error')
    });
  }

  eliminar(id: number | undefined) {
    if (!id) return;
    Swal.fire({
      title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí'
    }).then((r) => {
      if (r.isConfirmed) {
        this.api.deleteProveedor(id).subscribe({
          next: () => { this.cargar(); Swal.fire('Eliminado', '', 'success'); }
        });
      }
    });
  }

  cancelar() {
    this.editando = false;
    this.form = { ruc: '', nombreEmpresa: '', contactoNombre: '', telefono: '', email: '', direccion: '', categoria: 'General', productos: [] };
  }

  // --- MÉTODOS DE PRODUCTOS (Inline) ---
  agregarProducto() {
    if (!this.form.productos) {
      this.form.productos = [];
    }
    this.form.productos.push({
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      tipo: '',
      imagen: ''
    });
  }

  quitarProducto(index: number) {
    if (this.form.productos) {
      this.form.productos.splice(index, 1);
    }
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file && this.form.productos) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.form.productos && this.form.productos[index]) {
          this.form.productos[index].imagen = e.target?.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }
}