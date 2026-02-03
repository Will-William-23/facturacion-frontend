import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent implements OnInit {
  
  facturas: any[] = [];
  fechaInicio: string = '';
  fechaFin: string = '';
  totalPeriodo: number = 0;

  constructor(private api: ApiService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos() {
    this.api.get('facturas').subscribe({
      next: (data) => {
        this.facturas = data;
        this.calcularTotal();
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  filtrar() {
    if (!this.fechaInicio || !this.fechaFin) {
      Swal.fire('Atención', 'Seleccione ambas fechas.', 'warning');
      return;
    }

    this.api.filtrarFacturas(this.fechaInicio, this.fechaFin).subscribe({
      next: (data) => {
        this.facturas = data;
        this.calcularTotal();
        this.cd.detectChanges();
        
        if (data.length === 0) {
          Swal.fire('Sin resultados', 'No hubo ventas en ese rango.', 'info');
        }
      },
      error: () => Swal.fire('Error', 'No se pudo filtrar', 'error')
    });
  }

  limpiarFiltro() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.cargarDatos();
  }
  calcularTotal() { this.totalPeriodo = this.facturas.reduce((sum, f) => sum + f.total, 0); }

  // --- FUNCIÓN MEJORADA: VER DETALLES ---
  verDetalle(factura: any) {
    let htmlTabla = `
      <table class="table table-sm table-bordered text-start" style="font-size: 0.9rem;">
        <thead class="table-light">
          <tr>
            <th>Prod</th>
            <th>Cant</th>
            <th>P. Unit</th>
            <th>IVA</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    factura.detalles.forEach((d: any) => {
      const subtotal = d.cantidad * d.precioUnitario;
      // Detectamos si tiene IVA calculando la diferencia (aproximada para visualización) o usando un campo si lo enviáramos
      // Pero como ya guardamos los totales en la factura, usamos eso para el final.
      // Aquí mostraremos si el producto graba IVA (visual).
      const tieneIva = d.producto.grabaIva ? '15%' : '0%';
      
      htmlTabla += `
        <tr>
          <td>${d.producto.nombre}</td>
          <td>${d.cantidad}</td>
          <td>$${d.precioUnitario.toFixed(2)}</td>
          <td>${tieneIva}</td>
          <td>$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    htmlTabla += `</tbody></table>`;

    // Resumen Financiero
    const subtotal = factura.subtotal || (factura.total / 1.15); // Fallback si es antiguo
    const iva = factura.totalIva || (factura.total - subtotal);
    
    htmlTabla += `
      <div class="text-end border-top pt-2">
        <p class="mb-1">Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
        <p class="mb-1">IVA (15%): <strong>$${iva.toFixed(2)}</strong></p>
        <h4 class="text-primary mt-2">Total: $${factura.total.toFixed(2)}</h4>
      </div>
    `;

    Swal.fire({
      title: `Factura #${factura.id}`,
      html: `
        <div class="text-start mb-3">
            <strong>Cliente:</strong> ${factura.cliente.nombre} ${factura.cliente.apellido}<br>
            <strong>Cédula:</strong> ${factura.cliente.cedula}<br>
            <strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleString()}
        </div>
        ${htmlTabla}
      `,
      width: '600px',
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Cerrar'
    });
  }

  descargarPDF(id: number) {
    Swal.fire({ title: 'Generando...', didOpen: () => Swal.showLoading() });
    this.api.descargarPDF(`reportes/factura/${id}/pdf`).subscribe({
      next: (blob) => {
        Swal.close();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Factura_${id}.pdf`; a.click();
      },
      error: () => Swal.fire('Error', 'No se pudo descargar', 'error')
    });
  }
}