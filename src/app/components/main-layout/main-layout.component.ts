import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {

  usuario: string = '';
  rol: string = '';
  rolEtiqueta: string = '';

  // VARIABLES DE PERMISOS (Estas son las que faltaban)
  esAdmin: boolean = false;
  esCliente: boolean = false; // <--- NEW
  canOperate: boolean = false; // Para Vendedor y Admin
  canReport: boolean = false;  // Para Contador y Admin

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.usuario = this.api.getUsername() || 'Usuario';
    this.rol = this.api.getRole() || 'INVITADO';

    // Configurar etiquetas y permisos según el rol
    if (this.rol === 'ADMIN') {
      this.rolEtiqueta = 'ADMINISTRADOR';
      this.esAdmin = true;
      this.canOperate = true;
      this.canReport = true;
    } else if (this.rol === 'VENDEDOR') {
      this.rolEtiqueta = 'VENDEDOR';
      this.canOperate = true;
      this.esAdmin = false;
      this.canReport = false;
    } else if (this.rol === 'CONTADOR') {
      this.rolEtiqueta = 'CONTADOR';
      this.canReport = true;
      this.esAdmin = false;
      this.canOperate = false;
    } else if (this.rol === 'CLIENTE') { // <--- NEW
      this.rolEtiqueta = 'CLIENTE';
      this.esCliente = true;
    } else {
      this.rolEtiqueta = 'INVITADO';
    }
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
  }

  navegar(ruta: string, rolesPermitidos: string[]) {
    // Si la lista está vacía (público) o incluye mi rol
    if (rolesPermitidos.length === 0 || rolesPermitidos.includes(this.rol)) {
      this.router.navigate([ruta]);
    } else {
      Swal.fire({
        title: 'Acceso Restringido',
        text: `Tu rol de ${this.rolEtiqueta} no tiene permiso para entrar aquí.`,
        icon: 'warning',
        confirmButtonColor: '#d33'
      });
    }
  }
}