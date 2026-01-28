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
  // LÓGICA DE REDIRECCIÓN POR ROL
  if(response.role === 'CLIENTE') {
  this.router.navigate(['/tienda']);
} else {
  this.router.navigate(['/dashboard']);
}
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