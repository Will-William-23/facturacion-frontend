import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Usuario } from '../../interfaces/usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  
  usuarios: Usuario[] = [];
  usuarioForm: Usuario = { username: '', password: '', role: 'VENDEDOR' };
  editando: boolean = false;

  // Inyectamos 'cd'
  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.api.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.cd.detectChanges(); // <-- ESTO FUERZA LA ACTUALIZACIÓN VISUAL
      },
      error: (e) => console.error(e)
    });
  }

  editarUsuario(user: Usuario) {
    this.editando = true;
    this.usuarioForm = { ...user, password: '' };
  }

  guardarUsuario() {
    if (!this.usuarioForm.username.trim()) {
      Swal.fire('Error', 'El nombre de usuario es obligatorio', 'warning');
      return;
    }
    
    if (!this.editando && !this.usuarioForm.password) {
      Swal.fire('Error', 'La contraseña es obligatoria para nuevos usuarios', 'warning');
      return;
    }

    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    if (this.editando && this.usuarioForm.id) {
      this.api.updateUsuario(this.usuarioForm.id, this.usuarioForm).subscribe({
        next: () => this.finalizar('Usuario actualizado'),
        error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      });
    } else {
      this.api.createUsuario(this.usuarioForm).subscribe({
        next: () => this.finalizar('Usuario creado'),
        error: () => Swal.fire('Error', 'No se pudo crear (¿Nombre duplicado?)', 'error')
      });
    }
  }

  eliminarUsuario(id: number | undefined) {
    if(!id) return;
    const actualUser = this.api.getUsername();
    const userAEliminar = this.usuarios.find(u => u.id === id);
    
    if(userAEliminar?.username === actualUser) {
        Swal.fire('Acción Inválida', 'No puedes eliminarte a ti mismo.', 'error');
        return;
    }

    Swal.fire({
      title: '¿Eliminar usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteUsuario(id).subscribe({
          next: () => { 
            this.cargarUsuarios(); 
            Swal.fire('Eliminado', '', 'success'); 
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  cancelar() {
    this.editando = false;
    this.usuarioForm = { username: '', password: '', role: 'VENDEDOR' };
  }

  finalizar(msg: string) {
    Swal.fire('Éxito', msg, 'success');
    this.cargarUsuarios();
    this.cancelar();
  }
}