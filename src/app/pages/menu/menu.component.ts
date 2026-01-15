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

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.usuario = this.api.getUsername() || 'Usuario';
    this.rol = this.api.getRole() || 'INVITADO';
    
    // Etiquetas amigables
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
  // Recibe la ruta y una lista de roles permitidos (Ej: ['ADMIN', 'VENDEDOR'])
  navegar(ruta: string, rolesPermitidos: string[]) {
    
    // 1. Si el usuario tiene uno de los roles permitidos, pasa.
    if (rolesPermitidos.includes(this.rol)) {
      this.router.navigate([ruta]);
    } 
    // 2. Si no tiene permiso, BLOQUEAMOS y mostramos alerta.
    else {
      Swal.fire({
        title: 'Acceso Restringido',
        text: `Tu rol de ${this.rolEtiqueta} no tiene permisos para acceder a este módulo.`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Entendido'
      });
    }
  }
}