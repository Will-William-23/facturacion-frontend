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
  form: Proveedor = { ruc: '', nombreEmpresa: '', contactoNombre: '', telefono: '', email: '', direccion: '' };
  editando: boolean = false;
  searchText: string = '';

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargar(); }

  cargar() {
    this.api.getProveedores().subscribe({
      next: (data) => { this.proveedores = data; this.cd.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  editar(item: Proveedor) {
    this.editando = true;
    this.form = { ...item };
  }

  guardar() {
    if (!this.form.ruc.trim() || !this.form.nombreEmpresa.trim()) {
      Swal.fire('Error', 'RUC y Empresa son obligatorios', 'warning');
      return;
    }

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    const obs = (this.editando && this.form.id)
      ? this.api.updateProveedor(this.form.id, this.form)
      : this.api.createProveedor(this.form);

    obs.subscribe({
      next: () => {
        Swal.fire('Éxito', 'Proveedor guardado', 'success');
        this.form = { ruc: '', nombreEmpresa: '', contactoNombre: '', telefono: '', email: '', direccion: '' };
        this.editando = false;
        this.cargar();
      },
      error: () => Swal.fire('Error', 'No se pudo guardar', 'error')
    });
  }

  eliminar(id: number | undefined) {
    if(!id) return;
    Swal.fire({
      title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí'
    }).then((r) => {
      if(r.isConfirmed) {
        this.api.deleteProveedor(id).subscribe({
          next: () => { this.cargar(); Swal.fire('Eliminado', '', 'success'); }
        });
      }
    });
  }

  cancelar() {
    this.editando = false;
    this.form = { ruc: '', nombreEmpresa: '', contactoNombre: '', telefono: '', email: '', direccion: '' };
  }
}