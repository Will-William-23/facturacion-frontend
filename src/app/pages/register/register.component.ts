import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  
  // CAMBIO: El rol por defecto ahora es CLIENTE
  usuario = { username: '', password: '', role: 'CLIENTE' };
  loading = false;

  constructor(private api: ApiService, private router: Router) {}

  onRegister() {
    if (!this.usuario.username || !this.usuario.password) {
      Swal.fire('Error', 'Complete todos los campos', 'warning');
      return;
    }

    this.loading = true;

    this.api.register(this.usuario).subscribe({
      next: (resp) => {
        Swal.fire({
          title: '¡Cuenta Creada!',
          text: resp.mensaje || 'Registro exitoso',
          icon: 'success',
          confirmButtonText: 'Ir al Login'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (e) => {
        this.loading = false;
        const msg = e.error?.error || 'El nombre de usuario ya existe o hubo un error.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }
}