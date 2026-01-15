import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../interfaces/cliente';
import { FilterPipe } from '../../pipes/filter.pipe'; // <-- Importar Pipe
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe], // <-- Agregar Pipe
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  
  clientes: Cliente[] = [];
  clienteForm: Cliente = { cedula: '', nombre: '', apellido: '', direccion: '', email: '' };
  editando: boolean = false;
  searchText: string = ''; // <-- Variable para el buscador

  private soloLetrasRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarClientes(); }

  cargarClientes() {
    this.api.get('clientes').subscribe({
      next: (data) => { this.clientes = data; this.cd.detectChanges(); },
      error: (e) => console.error(e)
    });
  }

  // --- ALGORITMO DE VALIDACIÓN DE CÉDULA ECUATORIANA ---
  validarCedula(cedula: string): boolean {
    if (cedula.length !== 10) return false;
    const digitoRegion = parseInt(cedula.substring(0, 2));
    if (digitoRegion < 1 || digitoRegion > 24) return false;
    
    const ultimoDigito = parseInt(cedula.substring(9, 10));
    let pares = 0, impares = 0, suma = 0;

    for (let i = 0; i < 9; i++) {
      let digito = parseInt(cedula.substring(i, i + 1));
      if (i % 2 === 0) { // Posiciones impares (0, 2, 4...)
        digito = digito * 2;
        if (digito > 9) digito -= 9;
        impares += digito;
      } else {
        pares += digito;
      }
    }
    suma = pares + impares;
    let decena = (Math.floor(suma / 10) + 1) * 10;
    if ((decena - suma) === 10) decena = suma;
    
    const validador = decena - suma;
    return validador === ultimoDigito;
  }

  editarCliente(cliente: Cliente) {
    this.editando = true;
    this.clienteForm = { ...cliente };
  }




  
  guardarCliente() {
    // Validaciones
    if (!this.validarCedula(this.clienteForm.cedula)) {
      Swal.fire('Cédula Inválida', 'Ingrese un número de cédula ecuatoriana real.', 'error');
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

   Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    const observable = (this.editando && this.clienteForm.id) 
      ? this.api.put(`clientes/${this.clienteForm.id}`, this.clienteForm)
      : this.api.post('clientes', this.clienteForm);

    observable.subscribe({
      next: () => this.finalizarOperacion(this.editando ? 'Actualizado' : 'Creado'),
      error: (err) => {
        console.error(err); // Ver error en consola
        
        // MANEJO DE ERRORES INTELIGENTE
        if (err.status === 403) {
          Swal.fire('Acceso Denegado', 'No tienes permiso para realizar esta acción. Contacta al Admin.', 'error');
        } else if (err.status === 400 || err.status === 409) {
          Swal.fire('Datos Duplicados', 'Ya existe un cliente con esa Cédula o Email.', 'warning');
        } else {
          Swal.fire('Error', 'Ocurrió un error en el servidor.', 'error');
        }
      }
    });
  }




  // ... (Mantener métodos eliminarCliente, cancelarEdicion, finalizarOperacion igual que antes) ...
  eliminarCliente(id: number | undefined) {
    if(!id) return;
    Swal.fire({
      title: '¿Eliminar?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.delete(`clientes/${id}`).subscribe({
          next: () => { this.cargarClientes(); Swal.fire('Eliminado', '', 'success'); }
        });
      }
    });
  }

  cancelarEdicion() {
    this.editando = false;
    this.clienteForm = { cedula: '', nombre: '', apellido: '', direccion: '', email: '' };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Éxito', msg, 'success');
    this.cancelarEdicion();
    this.cargarClientes();
  }



}
