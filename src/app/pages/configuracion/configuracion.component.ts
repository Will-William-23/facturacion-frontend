import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Configuracion } from '../../interfaces/configuracion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {

  config: Configuracion = {
    nombreEmpresa: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    obligadoContabilidad: 'NO',
    ivaPorcentaje: 15
  };

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.getConfig().subscribe({
      next: (data) => this.config = data,
      error: (e) => console.error(e)
    });
  }

  guardar() {
    Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });

    this.api.updateConfig(this.config).subscribe({
      next: () => Swal.fire('Éxito', 'Datos de la empresa actualizados', 'success'),
      error: () => Swal.fire('Error', 'No se pudo guardar', 'error')
    });
  }
}