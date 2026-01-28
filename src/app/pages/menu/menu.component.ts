import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  usuario: string = '';
  rol: string = '';
  rolEtiqueta: string = '';
  esAdmin: boolean = false;

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    this.usuario = this.api.getUsername() || 'Usuario';
    this.rol = this.api.getRole() || 'INVITADO';

    // Mapeo de etiquetas para que se vea profesional
    const etiquetas: any = {
      'ADMIN': 'ADMINISTRADOR',
      'VENDEDOR': 'VENDEDOR',
      'CONTADOR': 'CONTADOR / AUDITOR'
    };

    this.rolEtiqueta = etiquetas[this.rol] || this.rol;
    this.esAdmin = (this.rol === 'ADMIN');
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
  }

  // --- FUNCIÓN INTELIGENTE DE NAVEGACIÓN ---
  // Verifica si el usuario tiene permiso antes de cambiar de página
  navegar(ruta: string, rolesPermitidos: string[]) {

    // 1. Si la lista está vacía (acceso público) o si mi rol está en la lista:
    if (rolesPermitidos.length === 0 || rolesPermitidos.includes(this.rol)) {
      this.router.navigate([ruta]);
    }
    // 2. Si no tiene permiso, BLOQUEAMOS y mostramos alerta roja.
    else {
      Swal.fire({
        title: 'Acceso Restringido',
        text: `Tu perfil de ${this.rolEtiqueta} no tiene autorización para ingresar a este módulo.`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Entendido'
      });
    }
  }
}