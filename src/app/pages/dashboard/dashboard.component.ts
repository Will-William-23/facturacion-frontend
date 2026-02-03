import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {

  // Datos del Monitor
  data = { 
    ventasTotales: 0, 
    totalClientes: 0, 
    totalProductos: 0, 
    stockTotal: 0, 
    ultimasVentas: [0,0,0,0,0,0,0]
  };
  
  cpuUso: number = 0;
  conectado: boolean = false;

  @ViewChild('ventasChart') ventasChartRef!: ElementRef;
  chart: any;

  constructor(
    private wsService: WebSocketService, 
    private api: ApiService, // Mantenemos ApiService disponible
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.wsService.connect();

    this.wsService.isConnected$.subscribe(status => {
      this.conectado = status;
      this.cd.detectChanges();
    });

    this.wsService.dashboardUpdates$.subscribe((newData: any) => {
      this.data = newData;
      this.cpuUso = newData.cpuUso;
      this.actualizarGrafica();
      this.cd.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.iniciarGrafica();
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
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
          data: this.data.ultimasVentas,
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
        scales: { 
          y: { beginAtZero: true, grid: { display: false } }, 
          x: { grid: { display: false } } 
        }
      }
    });
  }

  actualizarGrafica() {
    if (this.chart && this.data.ultimasVentas) {
      this.chart.data.datasets[0].data = this.data.ultimasVentas;
      this.chart.update();
    }
  }
}