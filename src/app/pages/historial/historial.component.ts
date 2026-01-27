import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FacturaResumen } from '../../interfaces/lista-facturas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {

  facturas: any[] = []; // Cambiado a any para soportar la estructura extendida
  tipoSeleccionado: 'VENTA' | 'COMPRA' = 'VENTA';

  get facturasFiltradas() {
    if (this.tipoSeleccionado === 'VENTA') {
      return this.facturas.filter(f => !f.tipo || f.tipo === 'VENTA');
    } else {
      return this.facturas.filter(f => f.tipo === 'COMPRA');
    }
  }

  constructor(private api: ApiService, private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.api.get('facturas').subscribe({
      next: (data) => {
        this.facturas = data;
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  descargarPDF(id: number) {
    Swal.fire({ title: 'Generando PDF...', didOpen: () => Swal.showLoading() });

    // Llamada al endpoint correcto
    this.api.descargarPDF(`reportes/factura/${id}/pdf`).subscribe({
      next: (blob: Blob) => {
        Swal.close();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (e) => {
        Swal.close();
        console.error(e);
        Swal.fire('Error', 'No se pudo descargar el PDF. Verifique que la factura exista.', 'error');
      }
    });
  }
}
