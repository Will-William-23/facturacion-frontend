import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  ventasTotales: number = 0;
  usuariosConectados: number = 0;
  cpuUso: number = 0;
  totalClientes: number = 0;
  totalProductos: number = 0;
  
  // Variable para el estado visual
  conectado: boolean = false;

  @ViewChild('ventasChart') ventasChartRef!: ElementRef;
  chart: any;

  constructor(private wsService: WebSocketService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.wsService.connect();

    // Escuchar datos
    this.wsService.dashboardUpdates$.subscribe((data: any) => {
      this.actualizarDatos(data);
    });

    // Escuchar estado de conexión (Nuevo)
    this.wsService.isConnected$.subscribe(status => {
      this.conectado = status;
      this.cd.detectChanges(); // Actualizar vista
    });
  }

  ngAfterViewInit(): void { this.iniciarGrafica(); }
  ngOnDestroy(): void { this.wsService.disconnect(); }

  actualizarDatos(data: any) {
    this.ventasTotales = data.ventasTotales;
    this.usuariosConectados = data.usuariosConectados;
    this.cpuUso = data.cpuUso;
    this.totalClientes = data.totalClientes;
    this.totalProductos = data.totalProductos;

    if (this.chart) {
      this.chart.data.datasets[0].data = data.ultimasVentas;
      this.chart.update();
    }
    this.cd.detectChanges();
  }

  iniciarGrafica() {
    if (!this.ventasChartRef) return;
    const ctx = this.ventasChartRef.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['60s', '50s', '40s', '30s', '20s', '10s', 'Ahora'],
        datasets: [{
          label: 'Transacciones / Minuto',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 0 },
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
      }
    });
  }
}