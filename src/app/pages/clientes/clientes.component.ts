import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { FilterPipe } from '../../pipes/filter.pipe';
import { SortPipe } from '../../pipes/sort.pipe'; // <-- IMPORTAR SORT
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe, SortPipe], // <-- AGREGAR AQUÍ
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  
  clientes: Cliente[] = [];
  clienteForm: Cliente = { cedula: '', nombre: '', apellido: '', direccion: '', email: '', telefono: '' };
  mensaje: string = '';
  editando: boolean = false;
  
  // VARIABLES DE FILTRO
  searchText: string = '';
  sortField: string = 'nombre'; // Campo por defecto
  sortDir: 'asc' | 'desc' = 'asc';

  private soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private telefonoRegex = /^[0-9+ ]{7,15}$/;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarClientes(); }

  cargarClientes() {
    this.api.get('clientes').subscribe({
      next: (data) => { this.clientes = data; this.cd.detectChanges(); },
      error: (e) => console.error(e)
    });
  }
// Métodos auxiliares para ordenar desde la cabecera de la tabla (Opcional)
  cambiarOrden(campo: string) {
    if (this.sortField === campo) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = campo;
      this.sortDir = 'asc';
    }
  }
  // --- VALIDACIÓN CÉDULA Y RUC ---
  validarIdentificacion(ident: string): boolean {
    // 1. Longitud: 10 (Cédula) o 13 (RUC)
    if (ident.length !== 10 && ident.length !== 13) return false;
    
    // Validación básica de provincia (2 primeros dígitos)
    const provincia = parseInt(ident.substring(0, 2));
    if (provincia < 1 || provincia > 24) return false;

    // Si es RUC, debe terminar en 001 (generalmente)
    if (ident.length === 13 && !ident.endsWith('001')) return false;

    return true; 
    // Nota: Simplificamos la validación matemática estricta para permitir RUCs de pruebas fácilmente
  }

  editarCliente(cliente: Cliente) {
    this.editando = true;
    this.clienteForm = { ...cliente };
  }

  guardarCliente() {
    // --- VALIDACIONES MEJORADAS ---
    if (!this.clienteForm.nombre.trim() || !this.clienteForm.apellido.trim()) {
      Swal.fire('Campos Vacíos', 'Nombre y Apellido son obligatorios.', 'warning');
      return;
    }
    
    // Validar ID (Cédula o RUC)
    if (!this.validarIdentificacion(this.clienteForm.cedula)) {
      Swal.fire('Identificación Inválida', 'Debe ser una Cédula (10 dígitos) o RUC (13 dígitos) válido.', 'error');
      return;
    }

    // Validar Teléfono
    if (!this.clienteForm.telefono || !this.telefonoRegex.test(this.clienteForm.telefono)) {
      Swal.fire('Teléfono Inválido', 'Ingrese un número válido (Ej: 0991234567).', 'warning');
      return;
    }

    if (!this.soloLetrasRegex.test(this.clienteForm.nombre) || !this.soloLetrasRegex.test(this.clienteForm.apellido)) {
      Swal.fire('Texto Inválido', 'Nombre y Apellido solo letras.', 'warning');
      return;
    }
    
    if (!this.emailRegex.test(this.clienteForm.email)) {
      Swal.fire('Email Inválido', 'Correo incorrecto.', 'warning');
      return;
    }
    
    if (!this.clienteForm.direccion.trim()) {
      Swal.fire('Campo Requerido', 'La dirección es obligatoria.', 'warning');
      return;
    }
    // ------------------------------

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    const observable = (this.editando && this.clienteForm.id) 
      ? this.api.put(`clientes/${this.clienteForm.id}`, this.clienteForm)
      : this.api.post('clientes', this.clienteForm);

    observable.subscribe({
      next: () => this.finalizarOperacion(this.editando ? 'Actualizado' : 'Creado'),
      error: () => Swal.fire('Error', 'No se pudo guardar (¿Datos duplicados?)', 'error')
    });
  }

  eliminarCliente(id: number | undefined) {
    if(!id) return;
    Swal.fire({
      title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`clientes/${id}`).subscribe({
          next: () => { this.cargarClientes(); Swal.fire('Eliminado', '', 'success'); },
          error: () => Swal.fire('Error', 'No se puede eliminar (Tiene facturas)', 'error')
        });
      }
    });
  }

  cancelarEdicion() {
    this.editando = false;
    this.clienteForm = { cedula: '', nombre: '', apellido: '', direccion: '', email: '', telefono: '' };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Éxito', msg, 'success');
    this.cancelarEdicion();
    this.cargarClientes();
  }
}