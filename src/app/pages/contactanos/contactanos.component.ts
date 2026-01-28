import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Configuracion } from '../../interfaces/configuracion';

@Component({
  selector: 'app-contactanos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contactanos.component.html',
  styleUrls: ['./contactanos.component.css']
})
export class ContactanosComponent implements OnInit {

  config: Configuracion = {
    nombreEmpresa: 'Cargando...',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    obligadoContabilidad: 'NO',
    ivaPorcentaje: 15
  };

  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.api.getConfig().subscribe({
      next: (data) => {
        this.config = data;
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }
}
