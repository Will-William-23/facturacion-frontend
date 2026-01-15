import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // <--- 1. IMPORTAR RouterLink
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2'; // Importar alertas


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // <--- 2. AGREGAR RouterLink AQUÍ
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  
  credentials = { username: '', password: '' };
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  onLogin() {
    // Validación básica antes de enviar
    if (!this.credentials.username || !this.credentials.password) {
      Swal.fire('Campos Vacíos', 'Ingrese usuario y contraseña', 'warning');
      return;
    }

    this.loading = true;

    
    this.api.login(this.credentials).subscribe({
      next: (response) => {
        this.api.saveSession(response.jwt, response.username, response.role);
        
        const Toast = Swal.mixin({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: `Bienvenido ${response.username}` });

        // NAVEGAR AL DASHBOARD
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'Usuario o contraseña incorrectos',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}