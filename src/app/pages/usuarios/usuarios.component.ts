import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importar CD
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Usuario } from '../../interfaces/usuario';
import { FilterPipe } from '../../pipes/filter.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FilterPipe],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  
  usuarios: Usuario[] = [];
  usuarioForm: Usuario = { username: '', password: '', role: 'VENDEDOR' };
  editando: boolean = false;
  searchText: string = '';

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {} // Inyectar

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.api.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cd.detectChanges(); // <-- Forzar actualización visual
      },
      error: (e) => console.error(e)
    });
  }

  editarUsuario(user: Usuario) {
    this.editando = true;
    this.usuarioForm = { ...user, password: '' }; // Limpiamos password para no sobreescribirla
  }

  guardarUsuario() {
    // VALIDACIONES
    if (!this.usuarioForm.username.trim()) {
      Swal.fire('Atención', 'El nombre de usuario es obligatorio.', 'warning');
      return;
    }
    
    // Si es nuevo, la contraseña es obligatoria
    if (!this.editando && !this.usuarioForm.password) {
      Swal.fire('Atención', 'Debe asignar una contraseña al nuevo usuario.', 'warning');
      return;
    }

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    const observable = (this.editando && this.usuarioForm.id)
      ? this.api.updateUsuario(this.usuarioForm.id, this.usuarioForm)
      : this.api.createUsuario(this.usuarioForm);

    observable.subscribe({
      next: () => this.finalizarOperacion(this.editando ? 'Usuario actualizado' : 'Usuario creado'),
      error: (e) => {
        console.error(e);
        Swal.fire('Error', 'No se pudo guardar. ¿Tal vez el nombre ya existe?', 'error');
      }
    });
  }

  eliminarUsuario(id: number | undefined) {
    if(!id) return;

    // PROTECCIÓN: Evitar auto-eliminación
    const currentUser = this.api.getUsername();
    const targetUser = this.usuarios.find(u => u.id === id);

    if (targetUser?.username === currentUser) {
      Swal.fire('Acción Denegada', 'No puedes eliminar tu propio usuario mientras estás logueado.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Eliminar usuario?',
      text: "Esta acción quitará el acceso al sistema inmediatamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar acceso'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteUsuario(id).subscribe({
          next: () => {
            this.cargarUsuarios();
            Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

  cancelar() {
    this.editando = false;
    this.usuarioForm = { username: '', password: '', role: 'VENDEDOR' };
  }

  finalizarOperacion(msg: string) {
    Swal.fire('Excelente', msg, 'success');
    this.cargarUsuarios();
    this.cancelar();
  }
}